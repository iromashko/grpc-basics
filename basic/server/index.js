let greets = require('./protos/greet_pb');
let service = require('./protos/greet_grpc_pb');

let calc = require('./protos/calculator_pb');
let calcService = require('./protos/calculator_grpc_pb');

let blogs = require('./protos/blog_pb');
let blogService = require('./protos/blog_grpc_pb');

const fs = require('fs');

const grpc = require('grpc');

const environment = process.env.ENVIRONMENT || 'development';
const config = require('./knexfile')[environment];
const knex = require('knex')(config);

function listBlog(call, cb) {
  console.log(`Received list blog request`);
  knex('blogs').then((data) => {
    data.forEach((el) => {
      let blog = new blogs.Blog();
      blog.setId(el.id);
      blog.setAuthor(el.author);
      blog.setTitle(el.title);
      blog.setContent(el.content);

      let blogResponse = new blogs.ListBlogResponse();
      blogResponse.setBlog(blog);

      call.write(blogResponse);
    });
    call.end();
  });
}

function createBlog(call, cb) {
  console.log(`Received Create Blog request`);

  let blog = call.request.getBlog();
  console.log('Inserting a Blog');

  knex('blogs')
    .insert({
      author: blog.getAuthor(),
      title: blog.getTitle(),
      content: blog.getContent(),
    })
    .then(() => {
      let id = blog.getId();
      let addedBlog = new blogs.Blog();
      addedBlog.setId(id);
      addedBlog.setAuthor(blog.getAuthor());
      addedBlog.setTitle(blog.getTitle());
      addedBlog.setContent(blog.getContent());

      let blogResponse = new blogs.CreateBlogResponse();

      blogResponse.setBlog(addedBlog);

      console.log(`Inserted Blog with ID: ${blogResponse}`);
      cb(null, blogResponse);
    });
}

function readBlog(call, cb) {
  console.log(`Received Blog request`);

  let blogId = call.request.getBlogId();

  knex('blogs')
    .where({ id: parseInt(blogId) })
    .then((data) => {
      console.log(`Searching for a blog...`);

      if (data.length) {
        let blog = new blogs.Blog();
        console.log(`Blog found and sending message`);
        blog.setId(blogId);
        blog.setAuthor(data[0].author);
        blog.setTitle(data[0].title);
        blog.setContent(data[0].content);

        let blogResponse = new blogs.ReadBlogResponse();
        blogResponse.setBlog(blog);

        cb(null, blogResponse);
      } else {
        console.log(`Blog not found`);
        return cb({
          code: grpc.status.NOT_FOUND,
          message: 'Blog Not Found!',
        });
      }
    });
}

function updateBlog(call, cb) {
  console.log(`Received updated Blog Request`);
  let blogId = call.request.getBlog().getId();
  console.log(`Searching for a blog to update`);

  knex('blogs')
    .where({ id: parseInt(blogId) })
    .update({
      author: call.request.getBlog().getAuthor(),
      title: call.request.getBlog().getTitle(),
      content: call.request.getBlog().getContent(),
    })
    .returning()
    .then((data) => {
      if (data) {
        let blog = new blogs.Blog();

        console.log(`Blog found sending message...`);

        blog.setId(blogId);
        blog.setAuthor(data.author);
        blog.setTitle(data.title);
        blog.setContent(data.content);

        let updateBlogResponse = new blogs.UpdateBlogResponse();
        updateBlogResponse.setBlog(blog);

        console.log(`Updated === ${updateBlogResponse.getBlog().getId()}`);
        cb(null, updateBlogResponse);
      } else {
        return cb({
          code: grpc.status.NOT_FOUND,
          message: 'Blog with the corresponding id was not found',
        });
      }
    });
}

function deleteBlog(call, cb) {
  console.log(`Received Delete Blog Request`);
  let blogId = call.request.getBlogId();

  knex('blogs')
    .where({ id: blogId })
    .delete()
    .returning()
    .then((data) => {
      console.log(`Blog deleting....`);
      if (data) {
        //TODO: check
        let deleteBlogResponse = new blogs.DeleteBlogResponse();
        deleteBlogResponse.setBlogId(blogId);
        console.log(
          `Blog requested in now deleted with id: ${deleteBlogResponse.toString()}`
        );
        cb(null, deleteBlogResponse);
      } else {
        console.log(`Not found...`)
        return cb({
          code: grpc.status.NOT_FOUND,
          message: 'Blog with the corresponding id was not found',
        });
      }
    });
}

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
  server.addService(blogService.BlogServiceService, {
    listBlog,
    createBlog,
    readBlog,
    updateBlog,
    deleteBlog,
  });
  // server.addService(calcService.CalculatorServiceService, {
  //   sum,
  //   primeNumberDecomposition,
  //   computeAverage,
  //   findMaximum,
  //   squareRoot,
  // });

  server.bind('127.0.0.1:50051', unsafeCreds);
  server.start();
  console.log(`Server running on port 127.0.0.1:50051`);
}

main();
