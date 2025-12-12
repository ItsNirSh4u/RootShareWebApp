// MongoDB initialization script
db = db.getSiblingDB('rootshare');

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'username', 'password'],
      properties: {
        email: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        },
        username: {
          bsonType: 'string',
          minLength: 3,
          maxLength: 30,
        },
        password: {
          bsonType: 'string',
        },
      },
    },
  },
});

db.createCollection('plants');
db.createCollection('posts');
db.createCollection('comments');
db.createCollection('likes');

// Create indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true });
db.plants.createIndex({ userId: 1 });
db.posts.createIndex({ userId: 1 });
db.posts.createIndex({ createdAt: -1 });
db.comments.createIndex({ postId: 1 });
db.likes.createIndex({ postId: 1, userId: 1 }, { unique: true });

print('MongoDB initialization completed');
