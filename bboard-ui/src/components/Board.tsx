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

  const PREDEPLOYED_CONTRACT_ADDRESS =
    '0200dbf964f541e1950883f5b2f539b66fd6111e46ce8e6e9551fbdd180114d5dd5b' as ContractAddress;

  const onCreateBoard = useCallback(() => boardApiProvider.resolve(PREDEPLOYED_CONTRACT_ADDRESS), [boardApiProvider]);

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
        setSuccessMessage('Eligibility proven successfully without revealing CGPA or attendance.');
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
            Student Eligibility Pass
          </Typography>

          <Typography color="text.secondary">Create or join a private eligibility credential.</Typography>

          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={onCreateBoard} fullWidth>
              Create Eligibility Pass
            </Button>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                To join an existing pass, use the contract address option provided by the application.
              </Typography>
            </Box>
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
            title="Student Eligibility Pass"
            subheader={
              deployedBoardAPI
                ? toShortFormatContractAddress(deployedBoardAPI.deployedContractAddress)
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
              Prove that you satisfy the required academic conditions without revealing your actual CGPA or attendance.
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

                {eligibilityResult === true && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Eligibility verified ✓
                  </Alert>
                )}

                {eligibilityResult === false && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    Eligibility verification failed.
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
            ) : (
              <Skeleton variant="rectangular" width="100%" height={180} />
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
                  Issue Eligibility Credential
                </Button>

                <Button
                  variant="outlined"
                  fullWidth
                  startIcon={<VerifiedIcon />}
                  disabled={!isActive}
                  onClick={onProveEligibility}
                >
                  Prove Eligibility
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
