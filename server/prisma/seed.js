const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean DB
  await prisma.transaction.deleteMany();
  await prisma.bid.deleteMany();
  await prisma.auction.deleteMany();
  await prisma.image.deleteMany();
  await prisma.item.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const buyer1 = await prisma.user.create({
    data: {
      email: 'buyer1@vault.com',
      name: 'James Bond',
      password: hashedPassword,
      reputation: 100.0,
      role: 'USER',
    },
  });

  const buyer2 = await prisma.user.create({
    data: {
      email: 'buyer2@vault.com',
      name: 'Bruce Wayne',
      password: hashedPassword,
      reputation: 100.0,
      role: 'USER',
    },
  });

  const seller1 = await prisma.user.create({
    data: {
      email: 'seller1@vault.com',
      name: 'Aurelia Dupont',
      password: hashedPassword,
      reputation: 100.0,
      role: 'USER',
    },
  });

  const seller2 = await prisma.user.create({
    data: {
      email: 'seller2@vault.com',
      name: 'Maximilian Sterling',
      password: hashedPassword,
      reputation: 100.0,
      role: 'USER',
    },
  });

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@vault.com',
      name: 'Victoria Vance',
      password: hashedPassword,
      reputation: 100.0,
      role: 'ADMIN',
    },
  });

  // Create Admin table entry
  await prisma.admin.create({
    data: {
      email: 'admin@vault.com',
      name: 'Victoria Vance',
      password: hashedPassword,
    },
  });

  console.log('Users and Admins seeded.');

  // Create Luxury Items
  const itemsData = [
    {
      title: 'Rolex Cosmograph Daytona 116506',
      description: 'The ultimate racing chronograph. Features a stunning ice-blue dial, chestnut brown Cerachrom bezel, and a premium platinum Oyster bracelet. A masterpiece of horological engineering.',
      category: 'Watches',
      originalValue: 120000.0,
      sellerId: seller1.id,
      images: [
        'https://images.unsplash.com/photo-1547996160-81dfa63595aa?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&q=80&w=1000'
      ]
    },
    {
      title: 'Cartier 18K White Gold Diamond Ring',
      description: 'A legendary creation from Cartier. Features a 3.5 carat brilliant-cut central diamond flanked by pavé-set diamonds in 18k white gold. Fully certified with GIA certificate.',
      category: 'Jewelry',
      originalValue: 55000.0,
      sellerId: seller1.id,
      images: [
        'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&q=80&w=1000'
      ]
    },
    {
      title: '1964 Aston Martin DB5 Coupe',
      description: 'Fully restored by Aston Martin Works. Finished in Silver Birch with exquisite dark-navy Connolly leather. The quintessential gentleman\'s Grand Tourer and pop culture legend.',
      category: 'Cars',
      originalValue: 950000.0,
      sellerId: seller2.id,
      images: [
        'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1583121274602-3e2820c69888?auto=format&fit=crop&q=80&w=1000'
      ]
    },
    {
      title: 'Pablo Picasso "Tête de Femme" Sketch',
      description: 'Authentic 1952 charcoal and ink sketch on archival paper. Signed by Pablo Picasso, cataloged in Zervos Volume XV. Complete with certificate of authenticity from the Picasso Administration.',
      category: 'Fine Art',
      originalValue: 140000.0,
      sellerId: seller2.id,
      images: [
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&q=80&w=1000'
      ]
    },
    {
      title: 'Patek Philippe Perpetual Calendar 3940J',
      description: 'One of Patek Philippe\'s absolute icons. Self-winding perpetual calendar showing day, date, month, leap year, and 24-hour indication. Encased in 18k yellow gold.',
      category: 'Watches',
      originalValue: 85000.0,
      sellerId: seller1.id,
      images: [
        'https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&q=80&w=1000',
        'https://images.unsplash.com/photo-1539874754764-5a96559165b0?auto=format&fit=crop&q=80&w=1000'
      ]
    }
  ];

  console.log('Seeding items & scheduling initial auctions...');

  const now = new Date();
  const slotDurationMinutes = 1; // Dev setting for rapid transitions
  
  for (let i = 0; i < itemsData.length; i++) {
    const itemData = itemsData[i];
    
    // Create Item
    const item = await prisma.item.create({
      data: {
        title: itemData.title,
        description: itemData.description,
        category: itemData.category,
        originalValue: itemData.originalValue,
        sellerId: itemData.sellerId,
        images: {
          create: itemData.images.map(url => ({ url }))
        }
      }
    });

    // Schedule Auction
    // 1st auction starts immediately, ends in 1 min.
    // 2nd starts in 1 min, ends in 2 min, etc.
    const startTime = new Date(now.getTime() + i * slotDurationMinutes * 60 * 1000);
    const endTime = new Date(startTime.getTime() + slotDurationMinutes * 60 * 1000);
    const startingBid = itemData.originalValue * 0.10;

    // Set first one to LIVE, others to UPCOMING
    const status = i === 0 ? 'LIVE' : 'UPCOMING';

    await prisma.auction.create({
      data: {
        itemId: item.id,
        startTime,
        endTime,
        startingBid,
        status,
      }
    });

    console.log(`Scheduled: ${item.title} as ${status} (${startTime.toLocaleTimeString()} -> ${endTime.toLocaleTimeString()})`);
  }

  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
