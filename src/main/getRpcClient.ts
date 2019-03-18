import { startDynamicd } from './dynamicd/startDynamicd';
import BitcoinClient from 'bitcoin-core';
import { delay } from '../shared/system/delay';
import { RpcClient, RpcClientWrapper } from './RpcClient';
import { createAsyncQueue } from '../shared/system/createAsyncQueue';
import { QueuedCommand } from './QueuedCommand';
import { createPromiseResolver } from '../shared/system/createPromiseResolver';
import { createCancellationToken, CancellationToken } from '../shared/system/createCancellationToken';
import { DynamicdProcessInfo } from './dynamicd/DynamicdProcessInfo';

const isDevelopment = process.env.NODE_ENV === 'development'

interface BitcoinClientOptions {
    host: string,
    port: string,
    username: string,
    password: string
}

let rpcClientPromise: Promise<RpcClientWrapper>

export function getRpcClient(cancellationToken: CancellationToken) {
    if (typeof rpcClientPromise === 'undefined') {
        rpcClientPromise = createQueuedRpcClient(cancellationToken)
    }
    return rpcClientPromise
}

async function createQueuedRpcClient(masterCancellationToken: CancellationToken): Promise<RpcClientWrapper> {
    const cancellationToken = createCancellationToken(undefined, masterCancellationToken)
    const bb = createAsyncQueue<QueuedCommand>();
    const { client: rpcClient, processInfo } = await createRpcClient(cancellationToken);
    (async () => {
        while (!cancellationToken.isCancellationRequested) {

            let qc: QueuedCommand;
            try {
                qc = await bb.receive(cancellationToken)
            } catch (err) {
                if (cancellationToken.isCancellationRequested) {
                    console.warn("queuedRpcClient was cancelled")
                    break
                }
                else {
                    throw err
                }
            }
            const { action, promiseResolver: { resolve, reject } } = qc
            try {
                resolve(action(rpcClient.command))
            }
            catch (err) {
                reject(err)
            }

        }
        console.log("QueuedRpcClient cancelled")
    })()
    return {
        command: <T>(command: string, ...args: any[]): Promise<T> => {
            const promiseResolver = createPromiseResolver<T>()
            bb.post({ action: cmd => cmd(command, ...args), promiseResolver });
            return promiseResolver.promise
        },
        //cancel: () => cancellationToken.cancel(),

        processInfo
    }
}

async function createRpcClient(cancellationToken: CancellationToken): Promise<{ client: RpcClient, processInfo: DynamicdProcessInfo }> {
    const processInfo = await startDynamicd(cancellationToken);

    const client = await createBitcoinCoreClient({
        host: "localhost",
        port: "33650",
        username: processInfo.rpcUser,
        password: processInfo.rpcPassword
    });
    return { client, processInfo }
}
async function createBitcoinCoreClient(opts: BitcoinClientOptions): Promise<RpcClient> {
    const client = new BitcoinClient(opts);
    let errorMessageShown = false;
    //try every 2s until we get a non-error
    for (; ;) {
        try {
            await client.command("getinfo");
            break;
        }
        catch (err) {
            //console.error(err);
            if (!errorMessageShown) {
                console.error(isDevelopment ?
                    "error when attempting rpc call, will try again every 2s until success. did you start dynamicd in docker?" :
                    "error when attempting rpc call, will try again every 2s until success.")
                errorMessageShown = true;
            }
            await delay(2000);
            continue;
        }
    }
    console.log("rpc call successful. client is ready")
    //client is ready to be used
    return {
        command: (command: string, ...args: any[]) => client.command(command, ...args),
        //cancel: () => { },
        //dispose: () => { }
    }
}

