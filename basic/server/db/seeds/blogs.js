exports.seed = function (knex) {
  // Deletes ALL existing entries
  return knex('blogs')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('blogs').insert([
        {
          author: 'Stephane',
          title: 'Lorem ipsum dolor sit',
          content: 'First Blog',
        },
        {
          author: 'Paulo',
          title: 'Lorem ipsum dolor sit',
          content: 'First Blog',
        },
        {
          author: 'James',
          title: 'Lorem ipsum dolor sit',
          content: 'First Blog',
        },
      ]);
    });
};
