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

function callGreetManyTimes() {
  let client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let request = new greets.GreetManyTimesRequest();
  let greeting = new greets.Greeting();
  greeting.setFirstName('Paulo');
  greeting.setLastName('Dichone');

  request.setGreeting(greeting);

  let call = client.greetManyTimes(request, () => {});

  call.on('data', (response) => {
    console.log(`Client Streaming Response: ${response.getResult()}`);
  });

  call.on('status', (status) => {
    console.log(status);
  });

  call.on('error', (error) => {
    console.error(error.details);
  });

  call.on('end', () => {
    console.log(`Streaming Ended!`);
  });
}

function callPrimeNumberDecomposition() {
  let client = new calcService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
  let request = new calc.PrimeNumberDecompositionRequest();

  let number = 567890;
  request.setNumber(number);

  let call = client.primeNumberDecomposition(request, () => {});
  call.on('data', (response) => {
    console.log(`Prime Factors Found: `, response.getPrimeFactor());
  });
  call.on('error', (error) => {
    console.error(error);
  });
  call.on('status', (status) => {
    console.log(status);
  });
  call.on('end', () => {
    console.log(`Streaming Ended`);
  });
}

function callLongGreeting() {
  let client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
  let request = new greets.LongGreetRequest();
  let call = client.longGreet(request, (error, response) => {
    if (!error) {
      console.log(`Server response: `, response.getResult());
    } else {
      console.error(error);
    }
  });

  let count = 0;
  let intervalId = setInterval(() => {
    console.log(`Sending message ${count}`);

    let request = new greets.LongGreetRequest();
    let greeting = new greets.Greeting();
    greeting.setFirstName('Paulo');
    greeting.setLastName('Dichone');

    request.setGreet(greeting);

    let requestTwo = new greets.LongGreetRequest();
    let greetingTwo = new greets.Greeting();
    greetingTwo.setFirstName('I am');
    greetingTwo.setLastName('Romashko');

    requestTwo.setGreet(greetingTwo);

    call.write(request);
    call.write(requestTwo);

    if (++count > 3) {
      clearInterval(intervalId);
      call.end();
    }
  }, 1000);
}

function callComputeAverage() {
  let client = new calcService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
  let request = new calc.ComputeAverageRequest();
  let call = client.computeAverage(request, (error, response) => {
    if (!error) {
      console.log(
        `Received a response from the server - Average: ${response.getAverage()}`
      );
    } else {
      console.error(error);
    }
  });

  for (let i = 0; i < 1000; i++) {
    let request = new calc.ComputeAverageRequest();
    request.setNumber(i);
    call.write(request);
  }

  call.end();
}

function main() {
  // callGreetManyTimes();
  // callPrimeNumberDecomposition();
  // callGreetings();
  // callSum();
  // callLongGreeting();

  callComputeAverage();
}

main();
