import * as request from 'request-promise-native';
import * as amqp from 'amqplib/callback_api'
import {Channel, Connection} from "amqplib/callback_api";
import {Message} from "amqplib";
import {isMaster, isWorker, fork} from 'cluster';
import * as cluster from 'cluster';
import {cpus} from 'os';
import {readFileSync} from "fs";


let pullQueueName: string = 'potential-ids',
    pushQueueName: string = 'verified-ids',
    baseUrl = 'https://www.strava.com/athletes/',
    credentials = JSON.parse(readFileSync(__dirname + '/../credentials/credentials.json', 'utf-8')),
    server = 'amqp://' + credentials.QUEUE.USER + ':' + credentials.QUEUE.PASSWORD + '@' + credentials.QUEUE.HOST,
    checkExistence = (message: Message, pullChannel: Channel, connection: Connection) => {
        let url = baseUrl + message.content.toString();

        // process.send(process.pid + ' Fetching ' + url);

        request({
            method: 'HEAD',
            followRedirect: false,
            uri: url,
            // localAddress: '192.168.0.123'
        }).then((response: request.FullResponse) => {

            //  console.log(response);
            // Persist
            //  channel.ack(message);


            connection
                .createChannel((error, pushChannel) => {

                    if (error) {
                        process.send(process.pid);
                        process.send(error);
                        return false;
                    }

                    // process.send(process.pid + ' Channel created');
                    pushChannel.assertQueue(pushQueueName, {durable: true});
                    // process.send(process.pid + ' Send to queue');
                    pushChannel.sendToQueue(pushQueueName, Buffer.from(message.content.toString()), {persistent: true});

                    // process.send(process.pid + ' Profile ' + message.content.toString() + ' exists');

                    process.send(url);
                    pullChannel.ack(message);

                });


        }).catch((error) => {

            if (parseInt(error.message, 10) !== 302) {

                pullChannel.reject(message);

                setTimeout(() => {
                    process.send(process.pid);
                    process.send(error);
                    process.exit(0);
                }, 1000);

            } else {
                pullChannel.ack(message);
            }

        });
    },
    worker = () => {

        amqp.connect(server,
            (error, connection) => {

                if (error) {
                    process.send(process.pid);
                    process.send(error);
                    return false;
                }


                process.send(process.pid + ' Connected to RabbitMQ');

                connection.createChannel((error, channel) => {

                        if (error) {
                            process.send(process.pid);
                            process.send(error);
                            return false;
                        }

                        // process.send(process.pid + ' Channel created');

                        channel.assertQueue(pullQueueName, {durable: true});
                        channel.prefetch(1);
                        process.send(process.pid + ' Ready...');
                        channel.consume(pullQueueName, (message) => {
                            checkExistence(message, channel, connection);
                        }, {noAck: false}); // Dont delete on deliver

                    }
                );
            }
        );
    };


if (isMaster) {
    // fork child...

    //Fork the workers, one per CPU
    cpus()
        .forEach((cpu) => {
            fork()
                .on('message', (msg) => {
                    console.log(msg);
                });
        });

    cluster.on('exit', () => {
        console.log('Respawning');

        setTimeout(() => {
            fork().on('message', (msg) => {
                console.log(msg);
            });
        }, 12000);
    });

}
else if (isWorker) {
    process.send('Child started at ' + process.pid.toString());
    worker();
}


/////






