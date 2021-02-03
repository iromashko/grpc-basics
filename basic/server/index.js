let greets = require('./protos/greet_pb');
let service = require('./protos/greet_grpc_pb');

let calc = require('./protos/calculator_pb');
let calcService = require('./protos/calculator_grpc_pb');

const fs = require('fs');

const grpc = require('grpc');

function sum(call, callback) {
  let sumResponse = new calc.SumResponse();

  sumResponse.setSumResult(
    call.request.getFirstNumber() + call.request.getSecondNumber()
  );

  callback(null, sumResponse);
}

function greetManyTimes(call, callback) {
  let firstName = call.request.getGreeting().getFirstName();

  let count = 0;
  let intervalId = setInterval(() => {
    let greetManyTimesResponse = new greets.GreetManyTimesResponse();
    greetManyTimesResponse.setResult(firstName);

    call.write(greetManyTimesResponse);

    if (++count > 9) {
      clearInterval(intervalId);
      call.end();
    } else {
      count++;
    }
  }, 1000);
}

function primeNumberDecomposition(call, callback) {
  let number = call.request.getNumber();
  let divisor = 2;
  while (number > 1) {
    if (number % divisor === 0) {
      let primeNumberDecompositionResponse = new calc.PrimeNumberDecompositionResponse();
      primeNumberDecompositionResponse.setPrimeFactor(divisor);
      number = number / divisor;
      call.write(primeNumberDecompositionResponse);
    } else {
      divisor++;
      console.log(`Divisor has increased to ${divisor}`);
    }
  }

  call.end('');
}

function computeAverage(call, callback) {
  let sum = 0;
  let count = 0;

  call.on('data', (request) => {
    sum += request.getNumber();
    console.log(`Got number: ${request.getNumber()}`);
    count++;
  });

  call.on('error', (err) => {
    console.log(err);
  });

  call.on('end', () => {
    let average = sum / count;

    let response = new calc.ComputeAverageResponse();
    response.setAverage(average);

    callback(null, response);
  });
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

function longGreet(call, callback) {
  call.on('data', (request) => {
    let fullName = `${request
      .getGreet()
      .getFirstName()} ${request.getGreet().getLastName()}`;

    console.log(`Hello ${fullName}`);
  });

  call.on('error', (error) => {
    console.error(error);
  });
  call.on('end', () => {
    let response = new greets.LongGreetResponse();
    response.setResult('Long Greet Client Streaming....');
    callback(null, response);
  });
}

async function sleep(interval) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), interval);
  });
}

async function greetEveryone(call, callback) {
  call.on('data', (response) => {
    let fullName = `${response
      .getGreet()
      .getFirstName()} ${response.getGreet().getLastName()}`;

    console.log(`Hello ${fullName}`);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log(`The End...`);
  });

  for (let i = 0; i < 10; i++) {
    // let greeting = new greets.Greeting();
    // greeting.setFirstName('I am');
    // greeting.setLastName('Romashko');

    let request = new greets.GreetEveryoneResponse();
    request.setResult('I am Romashko');

    call.write(request);

    await sleep(1000);
  }

  call.end();
}
function findMaximum(call, callback) {
  let currentMaximum = 0;
  let currentNumber = 0;

  call.on('data', (request) => {
    currentNumber = request.getNumber();

    if (currentNumber > currentMaximum) {
      currentMaximum = currentNumber;

      let response = new calc.FindMaximumResponse();
      response.setMaximum(currentMaximum);
      call.write(response);
    } else {
      //
    }

    console.log(`Streamed number:  ${request.getNumber()}`);
  });

  call.on('error', (err) => {
    console.error(err);
  });

  call.on('end', () => {
    let response = new calc.FindMaximumResponse();
    response.setMaximum(currentMaximum);
    call.write(response);
    call.end();
    console.log('The End!');
  });
}

function squareRoot(call, callback) {
  let number = call.request.getNumber();
  if (number >= 0) {
    let numberRoot = Math.sqrt(number);
    let response = new calc.SquareRootResponse();
    response.setNumberRoot(numberRoot);
    callback(null, response);
  } else {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      message: `The number being sent in not positive - Number Sent: ${number}`,
    });
  }
}

function main() {
  let credentials = grpc.ServerCredentials.createSsl(
    fs.readFileSync('../certs/ca.crt'),
    [
      {
        cert_chain: fs.readFileSync('../certs/server.crt'),
        private_key: fs.readFileSync('../certs/server.key'),
      },
    ],
    true
  );

  let unsafeCreds = grpc.ServerCredentials.createInsecure();

  let server = new grpc.Server();
  // server.addService(service.GreetServiceService, {
  //   greet,
  //   greetManyTimes,
  //   longGreet,
  //   greetEveryone,
  // });
  server.addService(calcService.CalculatorServiceService, {
    sum,
    primeNumberDecomposition,
    computeAverage,
    findMaximum,
    squareRoot,
  });

  server.bind('127.0.0.1:50051', credentials);
  server.start();
  console.log(`Server running on port 127.0.0.1:50051`);
}

main();
