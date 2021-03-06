import React from "react";
import { CSSTransitionGroup } from 'react-transition-group';
import logo from "../../assets/svgs/logo_without_text.svg";
import passphrase from "../../assets/svgs/passphrase-32-white.svg";
import passphrasesecurefile from "../../assets/svgs/secure-file-32-white.svg";
import Box from "../ui-elements/Box";
import { SCard } from "../ui-elements/Card";
import Container from "../ui-elements/Container";
import { AppLogo } from '../ui-elements/Image';
import { H1, Text } from "../ui-elements/Text";
import { BackButton } from "../ui-elements/Button";
import { PickedDispatchProps } from "../../system/PickedDispatchProps";
import { OnboardingActions } from "../../../shared/actions/onboarding";


export interface RestoreAccountStateProps {

}

export type RestoreAccountDispatchProps = PickedDispatchProps<typeof OnboardingActions, "restoreWithPassphrase" | "restoreWithMnemonicFile" | "restoreCancelled">



type RestoreAccountProps = RestoreAccountDispatchProps & RestoreAccountStateProps

export const RestoreAccount: React.FunctionComponent<RestoreAccountProps> =
    ({ restoreWithPassphrase, restoreWithMnemonicFile, restoreCancelled }) =>
        <>
            <Box width="100%" margin="2em 0 -1.5em 0" align="center" >
                <AppLogo src={logo} width="100px" height="120px" />
            </Box>
            <CSSTransitionGroup
                transitionName="example"
                transitionAppear={true}
                transitionAppearTimeout={500}
                transitionEnter={false}
                transitionLeave={false}>
                <H1 align="center" colored fontWeight="600">Restore Account</H1>
                <Container height="50vh" padding="6em 0 0 0" >
                    <Box direction="column" align="center" width="100%">
                        <Box display="flex" direction="row" align="center" width="100%">
                            <BackButton onClick={() => restoreCancelled()} margin="70px 0 0 -350px" />
                            <SCard onClick={() => restoreWithPassphrase()} padding="2em 1em 1em 1em" height="140px" width="220px">
                                <img src={passphrase} height="60px" width="60px" style={{ margin: '0 0 1em 0' }} />
                                <Text align="center" color="white" fontSize="1em" fontWeight="bold">Restore using passphrase</Text>
                            </SCard>
                            <SCard onClick={() => restoreWithMnemonicFile()} padding="2em 1em 1em 1em" height="140px" width="220px">
                                <img src={passphrasesecurefile} height="60px" width="60px" style={{ margin: ' 0 0 1em 0' }} />
                                <Text align="center" color="white" fontSize="1em" fontWeight="bold" >Restore using Secure </Text>
                                <Text margin="0" align="center" color="white" fontSize="1em" fontWeight="bold" >Restore File </Text>
                            </SCard>
                        </Box>
                    </Box>
                </Container>
            </CSSTransitionGroup>
        </> 
