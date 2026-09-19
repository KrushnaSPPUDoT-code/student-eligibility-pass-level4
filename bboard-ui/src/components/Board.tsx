import React, { useCallback, useEffect, useState } from 'react';
import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import {
  Backdrop,
  CircularProgress,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Button,
  Typography,
  TextField,
  Chip,
  Box,
  Alert,
  Skeleton,
} from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CancelIcon from '@mui/icons-material/Cancel';
import CopyIcon from '@mui/icons-material/ContentPasteOutlined';

import { type BBoardDerivedState, type DeployedBBoardAPI } from '../../../api/src/index';

import { useDeployedBoardContext } from '../hooks';
import { type BoardDeployment } from '../contexts';
import { type Observable } from 'rxjs';

export interface BoardProps {
  boardDeployment$?: Observable<BoardDeployment>;
}

export const Board: React.FC<Readonly<BoardProps>> = ({ boardDeployment$ }) => {
  const boardApiProvider = useDeployedBoardContext();

  const [boardDeployment, setBoardDeployment] = useState<BoardDeployment>();

  const [deployedBoardAPI, setDeployedBoardAPI] = useState<DeployedBBoardAPI>();

  const [boardState, setBoardState] = useState<BBoardDerivedState>();

  const [errorMessage, setErrorMessage] = useState<string>();

  const [successMessage, setSuccessMessage] = useState<string>();

  const [isWorking, setIsWorking] = useState(!!boardDeployment$);

  const [eligibilityResult, setEligibilityResult] = useState<boolean>();

  const [income, setIncome] = useState('');
  const [creditScore, setCreditScore] = useState('');
  const [debt, setDebt] = useState('');
  const [inputError, setInputError] = useState<string>();

  const onCreateBoard = useCallback(() => {
    setInputError(undefined);

    if (!income || !creditScore || !debt) {
      setInputError('Please enter income, credit score, and total debt.');
      return;
    }

    if (!/^\d+$/.test(income) || !/^\d+$/.test(creditScore) || !/^\d+$/.test(debt)) {
      setInputError('Please enter valid whole-number financial values.');
      return;
    }

    const incomeValue = BigInt(income);
    const creditScoreValue = BigInt(creditScore);
    const debtValue = BigInt(debt);

    if (incomeValue <= 0n || creditScoreValue <= 0n || debtValue < 0n) {
      setInputError('Please enter valid financial values.');
      return;
    }

    boardApiProvider.resolve(undefined, incomeValue, creditScoreValue, debtValue);
  }, [boardApiProvider, income, creditScore, debt]);

  const onIssueCredential = useCallback(async () => {
    if (!deployedBoardAPI) return;

    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      setSuccessMessage(undefined);
      setEligibilityResult(undefined);

      await deployedBoardAPI.issueCredential();

      setSuccessMessage('Eligibility credential issued successfully.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI]);

  const onProveEligibility = useCallback(async () => {
    if (!deployedBoardAPI) return;

    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      setSuccessMessage(undefined);

      const result = await deployedBoardAPI.proveEligibility();

      setEligibilityResult(result);

      if (result) {
        setSuccessMessage('Risk eligibility proven successfully without revealing your financial values.');
      }
    } catch (error: unknown) {
      setEligibilityResult(false);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI]);

  const onRevokeCredential = useCallback(async () => {
    if (!deployedBoardAPI) return;

    try {
      setIsWorking(true);
      setErrorMessage(undefined);
      setSuccessMessage(undefined);
      setEligibilityResult(undefined);

      await deployedBoardAPI.revokeCredential();

      setSuccessMessage('Credential revoked successfully.');
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWorking(false);
    }
  }, [deployedBoardAPI]);

  const onCopyContractAddress = useCallback(async () => {
    if (deployedBoardAPI) {
      await navigator.clipboard.writeText(deployedBoardAPI.deployedContractAddress);

      setSuccessMessage('Contract address copied.');
    }
  }, [deployedBoardAPI]);

  useEffect(() => {
    if (!boardDeployment$) {
      return;
    }

    const subscription = boardDeployment$.subscribe(setBoardDeployment);

    return () => {
      subscription.unsubscribe();
    };
  }, [boardDeployment$]);

  useEffect(() => {
    if (!boardDeployment) {
      return;
    }

    if (boardDeployment.status === 'in-progress') {
      return;
    }

    setIsWorking(false);

    if (boardDeployment.status === 'failed') {
      setErrorMessage(
        boardDeployment.error.message.length ? boardDeployment.error.message : 'Encountered an unexpected error.',
      );
      return;
    }

    setDeployedBoardAPI(boardDeployment.api);

    const subscription = boardDeployment.api.state$.subscribe(setBoardState);

    return () => {
      subscription.unsubscribe();
    };
  }, [boardDeployment]);

  const isActive = boardState?.active === true;

  return (
    <Card
      sx={{
        position: 'relative',
        width: 420,
        minWidth: 420,
        minHeight: 430,
        margin: 'auto',
      }}
    >
      {!boardDeployment$ && (
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Private Credit & Risk Passport
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Enter your financial information privately. These values are used as private witnesses and are not displayed
            on the public credential.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Annual Income (₹)"
              type="number"
              value={income}
              onChange={(event) => setIncome(event.target.value)}
              fullWidth
            />

            <TextField
              label="Credit Score"
              type="number"
              value={creditScore}
              onChange={(event) => setCreditScore(event.target.value)}
              fullWidth
            />

            <TextField
              label="Total Debt (₹)"
              type="number"
              value={debt}
              onChange={(event) => setDebt(event.target.value)}
              fullWidth
            />

            <Box sx={{ p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                Eligibility requirements
              </Typography>
              <Typography variant="body2">Income ≥ ₹6,00,000</Typography>
              <Typography variant="body2">Credit Score ≥ 700</Typography>
              <Typography variant="body2">Debt-to-Income Ratio ≤ 40%</Typography>
            </Box>

            {inputError && <Alert severity="error">{inputError}</Alert>}

            <Button variant="contained" onClick={onCreateBoard} fullWidth>
              Deploy Risk Passport
            </Button>
          </Box>
        </CardContent>
      )}

      {boardDeployment$ && (
        <>
          <Backdrop
            sx={{
              position: 'absolute',
              color: '#fff',
              zIndex: (theme) => theme.zIndex.drawer + 1,
            }}
            open={isWorking}
          >
            <CircularProgress />
          </Backdrop>

          <CardHeader
            avatar={
              boardState ? (
                isActive ? (
                  <LockOpenIcon color="success" />
                ) : (
                  <LockIcon />
                )
              ) : (
                <Skeleton variant="circular" width={30} height={30} />
              )
            }
            title="Private Credit & Risk Passport"
            subheader={
              deployedBoardAPI
                ? toShortFormatContractAddress(deployedBoardAPI.deployedContractAddress)
                : boardDeployment?.status === 'failed'
                  ? 'Deployment failed'
                  : 'Loading contract...'
            }
            action={
              deployedBoardAPI ? (
                <Button size="small" onClick={onCopyContractAddress} title="Copy contract address">
                  <CopyIcon fontSize="small" />
                </Button>
              ) : null
            }
          />

          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Privacy-Preserving Eligibility
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Prove that you satisfy lending and risk requirements without revealing your income, credit score, or debt.
            </Typography>

            {boardState ? (
              <Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">Credential status</Typography>

                  <Chip
                    icon={isActive ? <VerifiedIcon /> : <CancelIcon />}
                    label={isActive ? 'Credential Active' : 'No Active Credential'}
                    color={isActive ? 'success' : 'default'}
                    sx={{ mt: 1 }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2">Credential version</Typography>

                  <Typography variant="h6">{boardState.credentialVersion.toString()}</Typography>
                </Box>
              </Box>
            ) : (
              <>
                <Skeleton variant="rectangular" width="100%" height={120} />
                {boardDeployment?.status === 'in-progress' && (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    Deploying your Risk Passport. Please approve the transaction in your 1AM wallet.
                  </Alert>
                )}
              </>
            )}

            {(eligibilityResult !== undefined || successMessage || errorMessage) && (
              <Box sx={{ mt: 2 }}>
                {eligibilityResult === true && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Risk eligibility verified ✓
                  </Alert>
                )}

                {eligibilityResult === false && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Risk eligibility verification failed.
                  </Alert>
                )}

                {successMessage && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    {successMessage}
                  </Alert>
                )}

                {errorMessage && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {errorMessage}
                  </Alert>
                )}
              </Box>
            )}
          </CardContent>

          <CardActions
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
              padding: 2,
            }}
          >
            {deployedBoardAPI && (
              <>
                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<VerifiedIcon />}
                  disabled={isActive}
                  onClick={onIssueCredential}
                >
                  Issue Risk Credential
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<VerifiedIcon />}
                  disabled={!isActive}
                  onClick={onProveEligibility}
                >
                  Prove Risk Eligibility
                </Button>

                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<CancelIcon />}
                  disabled={!isActive}
                  onClick={onRevokeCredential}
                >
                  Revoke Credential
                </Button>
              </>
            )}
          </CardActions>
        </>
      )}
    </Card>
  );
};

const toShortFormatContractAddress = (contractAddress: ContractAddress | undefined): React.ReactElement | undefined =>
  contractAddress ? (
    <span data-testid="board-address">
      0x
      {contractAddress.replace(/^[A-Fa-f0-9]{6}([A-Fa-f0-9]{8}).*([A-Fa-f0-9]{8})$/, '$1...$2')}
    </span>
  ) : undefined;
