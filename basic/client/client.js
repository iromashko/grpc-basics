let greets = require('../server/protos/greet_pb');
let service = require('../server/protos/greet_grpc_pb');

let calc = require('../server/protos/calculator_pb');
let calcService = require('../server/protos/calculator_grpc_pb');

let grpc = require('grpc');

function callGreetings() {
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

function callSum() {
  let client = new calcService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let sumRequest = new calc.SumRequest();

  sumRequest.setFirstNumber(10);
  sumRequest.setSecondNumber(22);
  client.sum(sumRequest, (error, response) => {
    if (!error) {
      console.log(
        sumRequest.getFirstNumber() +
          ' + ' +
          sumRequest.getSecondNumber() +
          ' + ' +
          response.getSumResult()
      );
    } else {
      console.error(error);
    }
  });
}

function main() {
  // callGreetings();
  callSum();
}

main();
