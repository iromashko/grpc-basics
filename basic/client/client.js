let greets = require('../server/protos/greet_pb');
let service = require('../server/protos/greet_grpc_pb');

let calc = require('../server/protos/calculator_pb');
let calcService = require('../server/protos/calculator_grpc_pb');

let blogs = require('../server/protos/blog_pb');
let blogService = require('../server/protos/blog_grpc_pb');

const fs = require('fs');

let grpc = require('grpc');
const { groupCollapsed } = require('console');

const credentials = grpc.credentials.createSsl(
  fs.readFileSync('../certs/ca.crt'),
  fs.readFileSync('../certs/client.key'),
  fs.readFileSync('../certs/client.crt')
);

function callUpdateBlog() {
  let client = new blogService.BlogServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let updateBlogRequest = new blogs.UpdateBlogRequest();
  let newBlog = new blogs.Blog();

  newBlog.setId('2');
  newBlog.setAuthor('Gary');
  newBlog.setTitle('Hello World!');
  newBlog.setContent('This is great, again!');

  updateBlogRequest.setBlog(newBlog);

  console.log(`Blog... ${newBlog.toString()}`);

  client.updateBlog(updateBlogRequest, (error, response) => {
    if (!error) {
      //
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log(`Not found`);
      } else {
        //
      }
    }
  });
}

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

async function sleep(interval) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), interval);
  });
}

async function callByDiFindMaximum() {
  console.log(`Hello i'm a gRPC Client`);

  let request = new calc.FindMaximumRequest();

  let client = new calcService.CalculatorServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let call = client.findMaximum(request, (error, response) => {
    call.on('data', (response) => {
      console.log(`Got new Max from server => ${response.getMaximum()}`);
    });
    call.on('error', (error) => {
      console.error(error);
    });
    call.on('end', () => {
      console.log(`Server is completed sending messages`);
    });
  });

  let data = [3, 5, 17, 9, 8, 30, 12];

  for (let i = 0; i < data.length; i++) {
    let request = new calc.FindMaximumRequest();
    console.log(`Sending number: ${data[i]}`);
    request.setNumber(data[i]);
    call.write(request);
    await sleep(1000);
  }

  call.end();
  await sleep(1000);
}

async function callBiDirect() {
  console.log(`Hello i'm a gRPC Client`);

  let request = new greets.GreetEveryoneRequest();

  let client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let call = client.greetEveryone(request, (error, response) => {
    console.log(`Server Response: ${response}`);
  });

  call.on('data', (response) => {
    console.log(`Hello Client ${response.getResult()}`);
  });

  call.on('error', (error) => {
    console.error(error);
  });

  call.on('end', () => {
    console.log(`Client The End`);
  });

  for (let i = 0; i < 10; i++) {
    let greeting = new greets.Greeting();
    greeting.setFirstName('Stephane');
    greeting.setLastName('Maarek');

    let request = new greets.GreetEveryoneRequest();
    request.setGreet(greeting);

    call.write(request);

    await sleep(1500);
  }

  call.end();
}

function getRPCDeadline(rpcType) {
  timeAllowed = 5000;

  switch (rpcType) {
    case 1:
      timeAllowed = 1000;
      break;
    case 2:
      timeAllowed = 7000;
      break;
    default:
      console.log(`Invalid RPC Type: Using Default Timeout`);
  }

  return new Date(Date.now() + timeAllowed);
}

function doErrorCall() {
  let deadline = getRPCDeadline(1);

  console.log(`Hello i'm a gRPC Client`);

  // let request = new calc.CalculatorServiceClient();

  let client = new service.GreetServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let number = 16;
  let squareRootRequest = new calc.SquareRootRequest();
  squareRootRequest.setNumber(number);

  client.squareRoot(squareRootRequest, { deadline }, (error, response) => {
    if (!error) {
      console.log(`Square root is `, response.getNumberRoot());
    } else {
      console.log(error);
    }
  });
}

function createBlog() {
  let client = new blogService.BlogServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let blog = new blogs.Blog();
  blog.setAuthor('Baby G');
  blog.setTitle('Baby blog post');
  blog.setContent('This is a great post');

  let blogRequest = new blogs.CreateBlogRequest();
  blogRequest.setBlog(blog);

  client.createBlog(blogRequest, (error, response) => {
    if (!error) {
      console.log(`Received create blog response ${response.toString()}`);
    } else {
      console.error(error);
    }
  });
}

function readBlog() {
  let client = new blogService.BlogServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
}

function callListBlogs() {
  let client = new blogService.BlogServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
  let emptyBlogRequest = new blogs.ListBlogRequest();
  let call = client.listBlog(emptyBlogRequest, () => {});

  call.on('data', (response) => {
    console.log(
      `Client streaming response: ${response.getBlog().toString()}`
    );
  });
  call.on('error', (error) => {
    console.error(error);
  });
  call.on('end', () => {
    console.log(`End`);
  });
}

function callReadBlog() {
  let client = new blogService.BlogServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );

  let readBlogRequest = new blogs.ReadBlogRequest();
  readBlogRequest.setBlogId('7');
  client.readBlog(readBlogRequest, (error, response) => {
    if (!error) {
      console.log(`Found a blog`, response.toString());
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log(`Not found`);
      } else {
        //
      }
    }
  });
}

function callDeleteBlog() {
  let client = new blogService.BlogServiceClient(
    'localhost:50051',
    grpc.credentials.createInsecure()
  );
  const deleteBlogRequest = new blogs.DeleteBlogRequest();
  const blogId = '4';

  deleteBlogRequest.setBlogId(blogId);

  client.deleteBlog(deleteBlogRequest, (error, response) => {
    if (!error) {
      console.log(`Deleted blog with id: ${response.toString()}`);
    } else {
      if (error.code === grpc.status.NOT_FOUND) {
        console.log(`Not found`);
      } else {
        console.log(`Sorry something went wrong`);
      }
    }
  });
}

function main() {
  // callGreetManyTimes();
  // callPrimeNumberDecomposition();
  // callGreetings();
  // callSum();
  // callLongGreeting();
  // callComputeAverage();
  // callBiDirect();
  // callByDiFindMaximum();
  // doErrorCall();
  // callListBlogs();
  // createBlog();
  callReadBlog();
  callUpdateBlog();
  callDeleteBlog();
}

main();
