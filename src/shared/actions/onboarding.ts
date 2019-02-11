import { ActionType, createStandardAction } from 'typesafe-actions';
import { CreateBdapAccountConfig } from '../dynamicd/interfaces/CreateBdapAccountConfig';
import { createLocalStandardAction } from '../system/createLocalStandardAction';
import { NamedValue } from '../system/validator/NamedValue';
import { ValidationResult } from '../system/validator/ValidationResult';

// interface OperationResult {
//     success: boolean
// }

// ensure this is added to ./index.ts RootActions
export const OnboardingActions = {

    validateField: createStandardAction('validate/request')<NamedValue<string>>(),

    fieldValidated: createStandardAction('validate/result')<NamedValue<ValidationResult<string>>>(),

    resetValidationForField: createLocalStandardAction('reset/validation')<NamedValue<void>>(),

    createAccount: createStandardAction('onboarding/CREATE_ACCOUNT')<void>(),
    submitUserName: createStandardAction('onboarding/USERNAME_SUBMIT')<string>(),
    submitCommonName: createStandardAction('onboarding/COMMONNAME_SUBMIT')<string>(),
    submitToken: createStandardAction('onboarding/TOKEN_SUBMIT')<string>(),
    submitPassword: createStandardAction('onboarding/SET_WALLET_PASSWORD')<string>(),
    commitUserName: createStandardAction('onboarding/COMMIT_USERNAME')<string>(),
    commitCommonName: createStandardAction('onboarding/COMMIT_COMMONNAME')<string>(),
    commitToken: createStandardAction('onboarding/COMMIT_TOKEN')<string>(),

    userNameCaptured: createStandardAction('onboarding/USER_NAME_CAPTURED')<void>(),
    commonNameCaptured: createStandardAction('onboarding/COMMON_NAME_CAPTURED')<void>(),
    tokenCaptured: createStandardAction('onboarding/TOKEN_CAPTURED')<void>(),
    createBdapAccountComplete: createStandardAction('onboarding/CREATE_BDAP_ACCOUNT_COMPLETE')<void>(),

    passwordCaptured: createStandardAction('onboarding/PASSWORD_CAPTURED')<void>(),

    backToCreateAccount: createStandardAction('go_back_to/CREATE_TOKEN')<void>(),
    beginCreateBdapAccount: createStandardAction('onboarding/BEGIN_CREATE_BDAP_ACCOUNT')<void>(),
    createBdapAccount: createStandardAction('onboarding/CREATE_BDAP_ACCOUNT')<CreateBdapAccountConfig>(),
    bdapAccountCreated: createStandardAction('onboarding/BDAP_ACCOUNT_CREATED')<string>(),
    createBdapAccountFailed: createStandardAction('onboarding/CREATE_BDAP_ACCOUNT_FAILED')<void>(),
    resetOnboarding: createStandardAction("onboarding/RESET_ONBOARDING")<void>(),

    walletPasswordSet: createStandardAction('onboarding/WALLET_PASSWORD_SET')<void>(),
    walletPasswordSetFailed: createStandardAction('onboarding/WALLET_PASSWORD_SET_FAILED')<void>(),

    mnemonicWarningAccepted: createStandardAction('onboarding/MNEMONIC_WARNING_ACCEPTED')<void>(),
    mnemonicSecured: createStandardAction('onboarding/MNEMONIC_SECURED')<void>(),
}

export type OnboardingActions = ActionType<typeof OnboardingActions>;

