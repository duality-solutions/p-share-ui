import React, { ChangeEvent, Component, FormEvent } from "react";
import { CSSTransitionGroup } from 'react-transition-group';
import { createValidatedFailurePayload } from "../../../shared/system/validator/createValidatedFailurePayload";
import { createValidatedSuccessPayload } from "../../../shared/system/validator/createValidatedSuccessPayload";
import { ValidationResult } from "../../../shared/system/validator/ValidationResult";
import logo from "../../assets/svgs/logo_without_text.svg";
import { validationScopes } from "../../reducers/validationScopes";
import Box from "../ui-elements/Box";
import { ArrowButton } from "../ui-elements/Button";
import { Card } from "../ui-elements/Card";
import Container from "../ui-elements/Container";
import { AppLogo } from '../ui-elements/Image';
import Input from "../ui-elements/Input";
import { LoadingSpinner } from "../ui-elements/LoadingSpinner";
import { H1, Text } from "../ui-elements/Text";
import { PickedDispatchProps } from "../../system/PickedDispatchProps";
import { OnboardingActions } from "../../../shared/actions/onboarding";

type PasswordUiType = "LOGIN" | "CREATE"

export interface PasswordCreateStateProps {
    password: string
    isValidating: boolean,
    validationResult?: ValidationResult<string>
    uiType: PasswordUiType
}

export type PasswordCreateDispatchProps = PickedDispatchProps<typeof OnboardingActions, "resetValidationForField" | "fieldValidated" | "submitPassword">


type PasswordCreateProps = PasswordCreateDispatchProps & PasswordCreateStateProps

interface PasswordCreateComponentState {
    password: string,
    confirmPassword: string,
}
export class PasswordCreateOrLogin extends Component<PasswordCreateProps, PasswordCreateComponentState>{
    constructor(props: PasswordCreateProps) {
        super(props)
        this.state = { password: "", confirmPassword: "" }
    }
    handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        let name: string = e.target.name
        let value: string = e.target.value
        if (name === 'password') {
            this.setState(state => ({ ...state, password: value }))
        }
        else if (name === 'confirmPassword') {
            this.setState(state => ({ ...state, confirmPassword: value }))
        }
        this.props.resetValidationForField({ scope: validationScopes.password, name: "password" })
    }
    handleSubmit = (e: FormEvent) => {
        console.log("submit", this.state)
        try {
            if (this.props.uiType === "LOGIN") {
                const payload = createValidatedSuccessPayload(validationScopes.password, "password", this.state.password);
                this.props.fieldValidated(payload)
                this.props.submitPassword(this.state.password)
            }
            else if (this.state.password !== this.state.confirmPassword) {
                const payload = createValidatedFailurePayload(validationScopes.password, "password", "Passwords do not match", this.state.password);
                this.props.fieldValidated(payload)

            }
            else if (!/.{6,}/.test(this.state.password)) {
                const payload = createValidatedFailurePayload(validationScopes.password, "password", "Password must be > 6 characters", this.state.password);
                this.props.fieldValidated(payload)
            }
            else {
                const payload = createValidatedSuccessPayload(validationScopes.password, "password", this.state.password);
                this.props.fieldValidated(payload)
                this.props.submitPassword(this.state.password)
            }

        } finally {
            //if we don't prevent form submission, causes a browser reload
            e.preventDefault()

        }
    }

    render() {
        const { isValidating, validationResult, uiType } = this.props
        const validationFailed = typeof validationResult !== 'undefined' && !validationResult.success
        const showFieldErrors = (validationFailed && typeof validationResult !== 'undefined' && !validationResult.isError)
        return <>
            <Box width="100%" margin="2em 0 -1.5em 0" align="center">
                <AppLogo src={logo} width="100px" height="120px" />
            </Box>

            <CSSTransitionGroup
                transitionName="example"
                transitionAppear={true}
                transitionAppearTimeout={500}
                transitionEnter={false}
                transitionLeave={false}>
                <H1 align="center" colored fontWeight="600">{uiType === "LOGIN" ? "Log in" : "Create Account"}</H1>
                {/* <Link style={({ position: "absolute", top: 0, left: 0 })} to={appRoutes.rtcPlayground.path}>webrtc playground</Link> */}
                <Container height="50vh" margin="10% 0 0 0">
                    <form onSubmit={this.handleSubmit}>
                        <Box direction="column" align="center" width="100%">
                            <Box direction="column" width="700px" align="start" margin="0 auto 0 auto">
                                <Card width="100%" align="center" minHeight="225px" padding="2em 12em 2em 8em">
                                    <Text fontSize="14px">{uiType === "LOGIN" ? "Enter password" : "Create a Password"}</Text>
                                    <Input value={this.state.password} name="password" onChange={this.handleChange} placeholder="Password"
                                        type="password" margin="1em 0 1em 0" padding="0 1em 0 1em" autoFocus={true} error={showFieldErrors} disabled={isValidating} />
                                    {
                                        uiType === "LOGIN"
                                            ? <></>
                                            : <>
                                                <Text fontSize="14px">Confirm Password</Text>
                                                <Input value={this.state.confirmPassword} name="confirmPassword" onChange={this.handleChange} placeholder="Password"
                                                    type="password" margin="1em 0 1em 0" padding="0 1em 0 1em" error={showFieldErrors} disabled={isValidating} />
                                            </>
                                    }
                                    {
                                        validationFailed
                                            ? (typeof validationResult !== 'undefined' ? validationResult.validationMessages : []).map((e, i) => <Text align="center" color="#e30429" key={i}>{e}</Text>)
                                            : <></>
                                    }
                                </Card>
                            </Box>
                            <Box direction="column" width="700px" align="right" margin="0 auto 0 auto">
                                <ArrowButton label={uiType === "CREATE" ? "Continue" : "Log in"} type="submit" disabled={isValidating} />
                                {
                                    isValidating ? <LoadingSpinner active label={uiType === "LOGIN" ? "Logging in..." : "Encrypting your data..."} size={50} /> : <></>
                                }
                            </Box>
                        </Box>
                    </form>
                </Container>
            </CSSTransitionGroup>
        </>
    }
}



