import * as amqp from 'amqplib/callback_api'
import {Channel, Connection} from "amqplib/callback_api";
import {readFileSync} from "fs";

let queueName: string = 'potential-ids',
    lastKnownId: number = 27793488,
    credentials = JSON.parse(readFileSync(__dirname + '/../credentials/credentials.json', 'utf-8')),
    server = 'amqp://' + credentials.QUEUE.USER + ':' + credentials.QUEUE.PASSWORD + '@' + credentials.QUEUE.HOST,
    //server:string = 'amqp://localhost',
    pushToQueue = (id: number, channel: Channel, connection: Connection) => {

        if (id % 100000 === 0) {
            console.log(id);
        }

        channel.sendToQueue(queueName, Buffer.from(id.toString()), {persistent: true});

        if (id <= lastKnownId) {
            if (id % 100000 === 0) {
                setTimeout(() => {
                    pushToQueue(id + 1, channel, connection);
                }, 10000);
            } else {
                process
                    .nextTick(() => {
                        pushToQueue(id + 1, channel, connection);
                    });
            }

        } else {
            setTimeout(() => {
                console.log('Sending done');

                connection.close();
                process.exit(0);
            }, 60000 * 10);
        }
    };

//  lastKnownId = 12000;
console.log(server);
amqp
    .connect(server,
        (error, connection) => {

            if (error) {
                console.log(error);
                return false;
            }

            console.log('Connected to RabbitMQ');

            connection
                .createChannel((error, channel) => {

                    if (error) {
                        console.log(error);
                        return false;
                    }

                    console.log('Channel created');
                    channel.assertQueue(queueName, {durable: true});
                    console.log('Send to queue');

                    pushToQueue(1, channel, connection);
                });
        });