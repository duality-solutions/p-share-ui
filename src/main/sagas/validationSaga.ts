import { put, takeEvery, call } from "redux-saga/effects";
import { getType } from "typesafe-actions";
import { Action } from "redux";
import OnboardingActions from "../../shared/actions/onboarding";
import { validateUsername } from "../validation/validateUsername";
import { validateDisplayname } from "../validation/validateDisplayname";

export function* validationSaga() {
    yield takeEvery((action: Action<any>) => /^validate\/request\//.test(action.type), function* (action: OnboardingActions) {
        switch (action.type) {
            case getType(OnboardingActions.validateUsername): {
                const username = action.payload
                const errors: string[] = yield call(validateUsername, username)

                yield put(OnboardingActions.usernameValidated({ success: errors.length == 0, value: username, errors }));
                break;
            }
            case getType(OnboardingActions.validateDisplayname): {
                const displayname = action.payload
                const errors: string[] = yield call(validateDisplayname, displayname)
                yield put(OnboardingActions.displaynameValidated({ success: errors.length == 0, value: displayname, errors }));

            }
        }
    });
}
