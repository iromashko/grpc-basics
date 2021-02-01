let greets = require('../server/protos/greet_pb');
let service = require('../server/protos/greet_grpc_pb');

let grpc = require('grpc');

function main() {
  console.log(`hello`);
  let client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let request = new greets.GreetRequest();
  let greeting = new greets.Greeting();
  greeting.setFirstName('Jerry');
  greeting.setLastName('Tom');

  request.setGreeting(greeting);

  client.greet(request, (error, response) => {
    if (!error) {
      console.log(`Greeting Response: `, response.getResult());
    } else {
      console.error(error);
    }
  });
}

main();
