import { takeEvery, select, put } from "redux-saga/effects";
import { getType, ActionType } from "typesafe-actions";
import { BdapActions } from "../../shared/actions/bdap";
import { MainRootState } from "../reducers";
import { LinkAcceptResponse } from "../../dynamicdInterfaces/LinkAcceptResponse";
import { unlockedCommandEffect } from "./effects/unlockedCommandEffect";
import { PendingLink } from "../../dynamicdInterfaces/links/PendingLink";
import { blinq } from "blinq";
import { RpcClient } from "../RpcClient";
import { getUserNameFromFqdn } from "../../shared/system/getUserNameFromFqdn";

export function* linkAcceptSaga(rpcClient: RpcClient) {


    yield takeEvery(getType(BdapActions.beginAcceptLink), function* ({ payload: { recipient, requestor } }: ActionType<typeof BdapActions.beginAcceptLink>) {
        const action = BdapActions.acceptLink({ recipient, requestor })
        yield put(action)
    })

    yield takeEvery(getType(BdapActions.acceptLink), function* (action: ActionType<typeof BdapActions.acceptLink>) {
        const { payload: { recipient, requestor, registrationDays } } = action;
        const userName: string = yield select((state: MainRootState) => state.user.userName);
        if (typeof userName === 'undefined') {
            throw Error("current user has no userName");
        }
        if (recipient !== userName) {
            throw Error(`recipient marked as ${recipient} but I am ${userName}`);
        }

        const pendingAcceptLinks: PendingLink[] = yield select((state: MainRootState) => state.bdap.pendingAcceptLinks);



        const linksToAccept = blinq(pendingAcceptLinks)
            .select(link => ({
                ...link,
                recipient: getUserNameFromFqdn(link.recipient_fqdn),
                requestor: getUserNameFromFqdn(link.requestor_fqdn)
            }))
            .where(link => (
                link.recipient === recipient && link.requestor === requestor)
                || (link.recipient === requestor && link.requestor === recipient))

        for (let { recipient, requestor } of linksToAccept) {
            let response: LinkAcceptResponse;
            try {
                response =
                    yield unlockedCommandEffect(rpcClient, client =>
                        typeof registrationDays === 'undefined'
                            ? client.command("link", "accept", recipient, requestor)
                            : client.command("link", "accept", recipient, requestor, registrationDays.toString()));
                console.log(response)
            } catch (err) {
                if (/^Insufficient funds/.test(err.message)) {
                    yield put(BdapActions.insufficientFunds("accept a link from " + requestor))

                } else {
                    throw err
                }
            }

        }


        yield put(BdapActions.getCompleteLinks())
        yield put(BdapActions.getPendingAcceptLinks())
        yield put(BdapActions.getBalance())

    });
}
