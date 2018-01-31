import * as amqp from 'amqplib/callback_api'

let queueName = 'hello';

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


                    channel.assertQueue(queueName, {durable: true}); //

                    let initTime = new Date().getTime();

                    console.log('Send to queue');

                    for (let i = 0; i < 1000; i += 1) {
                        channel.sendToQueue(queueName, Buffer.from((initTime + i).toString()), {persistent: true});
                    }

                    console.log('Sending done');

                    setTimeout(() => {
                        connection.close();
                        process.exit(0);
                    }, 500);

                });
        });