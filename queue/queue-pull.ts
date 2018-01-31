import * as amqp from 'amqplib/callback_api'

let queueName:string = 'hello';

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
                        console.log(message.content.toString());
                        setTimeout(() => {
                            console.log('Delete msg');
                            channel.ack(message);
                        }, 10000);

                    }, {noAck: false}); // Dont delete on deliver

                });
        });