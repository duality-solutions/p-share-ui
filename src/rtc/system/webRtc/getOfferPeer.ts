import { createEventEmitter } from "../../../shared/system/events/createEventEmitter";
import { createAsyncQueue } from "../../../shared/system/createAsyncQueue";
import { createPromiseResolver } from "../../../shared/system/createPromiseResolver";
import { RTCOfferPeer } from "./RTCOfferPeer";
import { OfferPeerEvents } from "./OfferPeerEvents";
import { waitForDrained } from "./waitForDrained";
import { delay } from "redux-saga";

export async function getOfferPeer<
    T extends string | Blob | ArrayBuffer | ArrayBufferView
>(peerConnectionConfig: RTCConfiguration): Promise<RTCOfferPeer<T>> {
    const eventDispatcher = createEventEmitter<OfferPeerEvents>();
    const peer = new RTCPeerConnection(peerConnectionConfig);
    peer.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        console.log("offerPeer ice candidate");
        if (event.candidate) {
            // These would normally be sent to answerPeer over some other transport,
            // like a websocket, but since this is local we can just set it here.
            //answerPeer.addIceCandidate(event.candidate);

            eventDispatcher.dispatchEvent("icecandidate", event.candidate);
        } else {
            console.log("dispatching local session description");
            eventDispatcher.dispatchEvent(
                "sessiondescription",
                peer.localDescription
            );
        }
    };
    const dataChannel = peer.createDataChannel("dataChannel", {
        ordered: true,
    });
    const queue = createAsyncQueue<T>();

    dataChannel.onclose = e => eventDispatcher.dispatchEvent("close", e);
    dataChannel.onerror = e => eventDispatcher.dispatchEvent("error", e);
    dataChannel.onmessage = e => queue.post(e.data);
    dataChannel.onopen = e => eventDispatcher.dispatchEvent("open", e);

    const rtcPeer = {
        createOffer: async () => {
            const pr = createPromiseResolver<RTCSessionDescription>();
            eventDispatcher.once(
                "sessiondescription",
                (sd: RTCSessionDescription) => pr.resolve(sd)
            );
            const offerInit = await peer.createOffer({});
            const offer = new RTCSessionDescription(offerInit);
            await peer.setLocalDescription(offer);
            return await pr.promise;
        },
        waitForDataChannelOpen: async () => {
            const prom = createPromiseResolver<void>();
            const res = () => prom.resolve();
            const rej: (evtObj: any) => void = e => prom.reject(e);
            eventDispatcher.addEventListener("open", res);
            eventDispatcher.addEventListener("error", rej);
            try {
                await prom.promise;
            } finally {
                eventDispatcher.removeEventListener("open", res);
                eventDispatcher.removeEventListener("error", rej);
            }
            return dataChannel;
        },
        setRemoteDescription: (sessionDescription: RTCSessionDescription) =>
            peer.setRemoteDescription(sessionDescription),
        //addIceCandidate: (candidate: RTCIceCandidate) => peer.addIceCandidate(candidate),
        addEventListener: eventDispatcher.addEventListener,
        once: eventDispatcher.once,
        removeEventListener: eventDispatcher.removeEventListener,
        get incomingMessageQueue() {
            return queue;
        },
        get dataChannel() {
            return dataChannel;
        },
        send: (data: T) => dataChannel.send(data as any),
        close: async () => {
            await waitForDrained(rtcPeer);
            await delay(20000);
            dataChannel && dataChannel.close();
            peer.close();
        },
    };
    return rtcPeer;
}
