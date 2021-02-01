let greets = require('./protos/greet_pb');
let service = require('./protos/greet_grpc_pb');

let calc = require('./protos/calculator_pb');
let calcService = require('./protos/calculator_grpc_pb');

const grpc = require('grpc');

function sum(call, callback) {
  let sumResponse = new calc.SumResponse();

  sumResponse.setSumResult(
    call.request.getFirstNumber() + call.request.getSecondNumber()
  );

  callback(null, sumResponse);
}

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
  // server.addService(service.GreetServiceService, { greet });
  server.addService(calcService.CalculatorServiceService, { sum });

  server.bind('127.0.0.1:50051', grpc.ServerCredentials.createInsecure());
  server.start();
  console.log(`Server running on port 127.0.0.1:50051`);
}

main();
