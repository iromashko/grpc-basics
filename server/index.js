let greets = require('../server/protos/greet_pb');
let service = require('../server/protos/greet_grpc_pb');

const grpc = require('grpc');

function greet(call, callback) {
  let greeting = new greets.GreetResponse();

  greeting.setResult(
    'Hello ' +
      call.request.getGreeting().getFirstName() +
      ' ' +
      call.request.getGreeting().getLastName()
  );

  callback(null, greeting);
}

function main() {
  let server = new grpc.Server();
  server.addService(service.GreetServiceService, { greet });

  server.bind('127.0.0.1:50051', grpc.ServerCredentials.createInsecure());
  server.start();
  console.log(`Server running on port 127.0.0.1:50051`);
}

main();
