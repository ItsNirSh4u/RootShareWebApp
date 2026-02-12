/**
 * MongoDB seed script for RootShare feed data
 * Run with: mongosh "mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin" scripts/seed-feed.js
 * Or from Docker: docker exec -i rootshare-mongodb mongosh "mongodb://rootshare:rootshare123@localhost:27017/rootshare?authSource=admin" < scripts/seed-feed.js
 */

// Pre-hashed password for "Password123!" using bcrypt (10 rounds)
const HASHED_PASSWORD = '$2b$10$xrPypfljsLFev7wdPU/2HubPtgPQSnTIwBo1abg8ZKwtAVtNZVCOK';

// Profile images from Unsplash
const profileImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face',
];

// Plant images
const plantImages = {
  monstera: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400&h=400&fit=crop',
  pothos: 'https://images.unsplash.com/photo-1597055181449-daf8a90e5893?w=400&h=400&fit=crop',
  succulent: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400&h=400&fit=crop',
  fern: 'https://images.unsplash.com/photo-1470058869958-2a77ade41c02?w=400&h=400&fit=crop',
  snake_plant: 'https://images.unsplash.com/photo-1593482892540-65888dc14a60?w=400&h=400&fit=crop',
  fiddle_leaf: 'https://images.unsplash.com/photo-1545241047-6083a3684587?w=400&h=400&fit=crop',
  cactus: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop',
  orchid: 'https://images.unsplash.com/photo-1567748157439-651aca5fa0e3?w=400&h=400&fit=crop',
  peace_lily: 'https://images.unsplash.com/photo-1593691509543-c55fb32e1ce8?w=400&h=400&fit=crop',
  philodendron: 'https://images.unsplash.com/photo-1602923668104-8f9e03e77e62?w=400&h=400&fit=crop',
};

// Post images
const postImages = [
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1446071103084-c257b5f70672?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1483794344563-d27a8d18014e?w=600&h=400&fit=crop',
];

const now = new Date();

print('🌱 Starting RootShare feed seed...\n');

// Clear existing test data
print('Clearing existing test data...');
db.posts.deleteMany({});
db.plants.deleteMany({});
db.likes.deleteMany({});
db.comments.deleteMany({});
db.users.deleteMany({ email: { $regex: /@example\.com$/ } });

// Test users
const testUsers = [
  { email: 'emma.green@example.com', username: 'emma_plantlover', profileImageUrl: profileImages[0] },
  { email: 'james.gardens@example.com', username: 'james_gardens', profileImageUrl: profileImages[1] },
  { email: 'sofia.botanica@example.com', username: 'sofia_botanica', profileImageUrl: profileImages[2] },
  { email: 'marcus.leaf@example.com', username: 'marcus_leaf', profileImageUrl: profileImages[3] },
  { email: 'olivia.roots@example.com', username: 'olivia_roots', profileImageUrl: profileImages[4] },
  { email: 'david.bloom@example.com', username: 'david_bloom', profileImageUrl: profileImages[5] },
  { email: 'luna.fern@example.com', username: 'luna_fern', profileImageUrl: profileImages[6] },
];

// Create users
print('Creating 7 test users...');
const userIds = [];
testUsers.forEach((user, i) => {
  const result = db.users.insertOne({
    email: user.email,
    username: user.username,
    password: HASHED_PASSWORD,
    profileImageUrl: user.profileImageUrl,
    role: 'user',
    authProvider: 'local',
    createdAt: now,
    updatedAt: now,
  });
  userIds.push(result.insertedId);
  print(`  ✓ Created user: ${user.username}`);
});

// Plants per user
const plantsPerUser = [
  [{ name: 'My Monstera', species: 'Monstera Deliciosa', img: plantImages.monstera },
   { name: 'Golden Pothos', species: 'Epipremnum aureum', img: plantImages.pothos }],
  [{ name: 'Snake Queen', species: 'Sansevieria trifasciata', img: plantImages.snake_plant },
   { name: 'Tiny Succulents', species: 'Echeveria elegans', img: plantImages.succulent }],
  [{ name: 'Fiddle Fig', species: 'Ficus lyrata', img: plantImages.fiddle_leaf },
   { name: 'Pink Orchid', species: 'Phalaenopsis', img: plantImages.orchid }],
  [{ name: 'Boston Fern', species: 'Nephrolepis exaltata', img: plantImages.fern },
   { name: 'Desert Cactus', species: 'Opuntia microdasys', img: plantImages.cactus }],
  [{ name: 'Peace Lily', species: 'Spathiphyllum', img: plantImages.peace_lily },
   { name: 'Philodendron Heart', species: 'Philodendron hederaceum', img: plantImages.philodendron }],
  [{ name: 'Variegated Monstera', species: 'Monstera deliciosa variegata', img: plantImages.monstera },
   { name: 'String of Pearls', species: 'Senecio rowleyanus', img: plantImages.succulent }],
  [{ name: 'Maidenhair Fern', species: 'Adiantum raddianum', img: plantImages.fern },
   { name: 'Neon Pothos', species: 'Epipremnum aureum Neon', img: plantImages.pothos }],
];

// Create plants
print('\nCreating plants...');
const plantIdsByUser = [];
userIds.forEach((userId, i) => {
  const plantIds = [];
  plantsPerUser[i].forEach(plant => {
    const result = db.plants.insertOne({
      userId: userId,
      name: plant.name,
      species: plant.species,
      status: 'active',
      imageUrl: plant.img,
      createdAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      updatedAt: now,
    });
    plantIds.push(result.insertedId);
  });
  plantIdsByUser.push(plantIds);
  print(`  ✓ Created ${plantsPerUser[i].length} plants for ${testUsers[i].username}`);
});

// Posts data
const postsPerUser = [
  [{ type: 'update', content: 'My Monstera just unfurled a new leaf! Look at those beautiful fenestrations 🌿 #MonsteraMonday #PlantParent #NewLeaf', plantIdx: 0, images: [plantImages.monstera, postImages[0]] },
   { type: 'swap', content: 'Looking to swap some Pothos cuttings! They root super easily and are perfect for beginners. DM if interested! #PlantSwap #PothosLovers', plantIdx: 1, images: [plantImages.pothos] }],

  [{ type: 'update', content: 'Snake plants are honestly the most low-maintenance plants ever. Perfect for busy plant parents! #SnakePlant #LowMaintenance', plantIdx: 0, images: [plantImages.snake_plant] },
   { type: 'giveaway', content: 'Giving away some succulent babies! They need a new home. First come first served in the Tel Aviv area 🌵 #PlantGiveaway #Succulents', plantIdx: 1, images: [plantImages.succulent, postImages[1]] }],

  [{ type: 'update', content: 'My fiddle leaf fig is finally thriving after months of trial and error! The secret? Consistent watering and lots of light ☀️ #FiddleLeafFig #PlantCare', plantIdx: 0, images: [plantImages.fiddle_leaf, postImages[2]] },
   { type: 'update', content: 'Orchid bloom season is here! These flowers last for months with proper care #OrchidLove #Blooming', plantIdx: 1, images: [plantImages.orchid] }],

  [{ type: 'swap', content: 'Anyone want to trade fern cuttings? I have Boston ferns and looking for some bird nest ferns! #FernFriday #PlantSwap', plantIdx: 0, images: [plantImages.fern] },
   { type: 'update', content: 'Desert vibes in my apartment 🏜️ This cactus collection is growing! #Cactus #DesertPlants #UrbanJungle', plantIdx: 1, images: [plantImages.cactus, postImages[3]] }],

  [{ type: 'update', content: 'Peace lilies are not just beautiful, they also purify the air! One of my favorite houseplants 💚 #PeaceLily #AirPurifying', plantIdx: 0, images: [plantImages.peace_lily, postImages[4]] },
   { type: 'giveaway', content: 'Giving away this philodendron - it has grown too big for my space! Pick up in Haifa only 🌱 #PlantGiveaway #Philodendron', plantIdx: 1, images: [plantImages.philodendron] }],

  [{ type: 'update', content: 'Variegated Monstera update! The white sections are getting bigger with each new leaf 🤍 #VariegatedMonstera #RarePlants', plantIdx: 0, images: [plantImages.monstera, postImages[5]] },
   { type: 'swap', content: 'Looking for plant swaps in Jerusalem! I have string of pearls cuttings available 📿 #PlantSwap #StringOfPearls', plantIdx: 1, images: [plantImages.succulent] }],

  [{ type: 'update', content: 'Maidenhair ferns are tricky but SO worth it! The delicate leaves are just stunning 🌿 #MaidenhairFern #PlantChallenge', plantIdx: 0, images: [plantImages.fern] },
   { type: 'swap', content: 'Neon pothos cuttings available for swap! These glow-in-the-dark beauties need more homes 💚 #NeonPothos #PlantSwap', plantIdx: 1, images: [plantImages.pothos] }],
];

// Create posts
print('\nCreating posts...');
let postCount = 0;
const postIds = [];
userIds.forEach((userId, i) => {
  postsPerUser[i].forEach(post => {
    const createdAt = new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000);
    const result = db.posts.insertOne({
      userId: userId,
      plantId: plantIdsByUser[i][post.plantIdx],
      type: post.type,
      content: post.content,
      images: post.images,
      commentsCount: Math.floor(Math.random() * 10),
      createdAt: createdAt,
      updatedAt: createdAt,
    });
    postIds.push(result.insertedId);
    postCount++;
  });
  print(`  ✓ Created ${postsPerUser[i].length} posts for ${testUsers[i].username}`);
});

// Add likes
print('\nAdding likes to posts...');
postIds.forEach(postId => {
  const numLikes = Math.floor(Math.random() * 5) + 1;
  const shuffled = [...userIds].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numLikes; i++) {
    try {
      db.likes.insertOne({
        parentId: postId,
        parentType: 'Post',
        userId: shuffled[i],
        createdAt: now,
      });
    } catch (e) {
      // Ignore duplicate key errors
    }
  }
});
print(`  ✓ Added likes to posts`);

print('\n✅ Seed completed successfully!');
print(`   - ${testUsers.length} users created`);
print(`   - ${plantsPerUser.flat().length} plants created`);
print(`   - ${postCount} posts created`);
print('\n📧 Test login credentials:');
print('   Email: emma.green@example.com');
print('   Password: Password123!');
print('');
