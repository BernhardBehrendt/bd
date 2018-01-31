import * as request from 'request-promise-native';
import * as amqp from 'amqplib/callback_api'
import {Channel} from "amqplib/callback_api";
import {Message} from "amqplib";

let queueName: string = 'potentialIds',
    baseUrl = 'https://www.strava.com/athletes/',

    checkExistence = (message: Message, channel: Channel) => {
        request({
            method: 'HEAD',
            followRedirect: false,
            uri: baseUrl + message.content.toString()
        }).then((response) => {
            console.log(response);
            // Persist
            //  channel.ack(message);

        }).catch((error) => {

            if (parseInt(error.message, 10) !== 302) {
                console.log(error);
                return false;
            }

            //  channel.ack(message);
        });
    };
amqp
    .connect('amqp://localhost',
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
                    channel.prefetch(1);
                    channel.consume(queueName, (message) => {
                        checkExistence(message, channel);
                    }, {noAck: false}); // Dont delete on deliver

                });
        });

/////






