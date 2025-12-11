import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const starterProducts = [
  // CLEANSERS (7 products)
  {
    name: 'Hydrating Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    ingredients: 'Ceramides, Hyaluronic Acid, Glycerin',
  },
  {
    name: 'Foaming Facial Cleanser',
    brand: 'CeraVe',
    category: 'Cleanser',
    ingredients: 'Ceramides, Niacinamide, Hyaluronic Acid',
  },
  {
    name: 'Gentle Skin Cleanser',
    brand: 'Cetaphil',
    category: 'Cleanser',
    ingredients: 'Glycerin, Panthenol',
  },
  {
    name: 'Ultra Facial Cleanser',
    brand: 'Kiehl\'s',
    category: 'Cleanser',
    ingredients: 'Squalane, Apricot Kernel Oil, Avocado Oil',
  },
  {
    name: 'Oil Cleanser',
    brand: 'DHC',
    category: 'Cleanser',
    ingredients: 'Olive Oil, Vitamin E',
  },
  {
    name: 'Salicylic Acid Cleanser',
    brand: 'La Roche-Posay',
    category: 'Cleanser',
    ingredients: 'Salicylic Acid, Glycolic Acid, Niacinamide',
  },
  {
    name: 'Soy Face Cleanser',
    brand: 'Fresh',
    category: 'Cleanser',
    ingredients: 'Soy Proteins, Rose Water, Cucumber Extract',
  },

  // TONERS (5 products)
  {
    name: 'Facial Treatment Essence',
    brand: 'SK-II',
    category: 'Toner',
    ingredients: 'Pitera, Galactomyces Ferment Filtrate',
  },
  {
    name: 'Glycolic Acid 7% Toning Solution',
    brand: 'The Ordinary',
    category: 'Toner',
    ingredients: 'Glycolic Acid, Aloe Vera, Ginseng',
  },
  {
    name: 'Witch Hazel Toner',
    brand: 'Thayers',
    category: 'Toner',
    ingredients: 'Witch Hazel, Rose Water, Aloe Vera',
  },
  {
    name: 'Treatment Lotion',
    brand: 'Tatcha',
    category: 'Toner',
    ingredients: 'Hadasei-3, Rice Ferment, Green Tea',
  },
  {
    name: 'Ultra Facial Toner',
    brand: 'Kiehl\'s',
    category: 'Toner',
    ingredients: 'Apricot Kernel Oil, Avocado Oil, Squalane',
  },

  // SERUMS (10 products)
  {
    name: 'Niacinamide 10% + Zinc 1%',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: 'Niacinamide, Zinc PCA',
  },
  {
    name: 'Hyaluronic Acid 2% + B5',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: 'Hyaluronic Acid, Vitamin B5',
  },
  {
    name: 'Vitamin C Serum',
    brand: 'Mad Hippie',
    category: 'Serum',
    ingredients: 'Vitamin C, Vitamin E, Ferulic Acid',
  },
  {
    name: 'C E Ferulic',
    brand: 'SkinCeuticals',
    category: 'Serum',
    ingredients: 'L-Ascorbic Acid, Vitamin E, Ferulic Acid',
  },
  {
    name: 'Advanced Night Repair',
    brand: 'Estée Lauder',
    category: 'Serum',
    ingredients: 'Bifidus Extract, Hyaluronic Acid',
  },
  {
    name: 'Retinol 0.5% in Squalane',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: 'Retinol, Squalane',
  },
  {
    name: 'Granactive Retinoid 2% Emulsion',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: 'Hydroxypinacolone Retinoate, Squalane',
  },
  {
    name: 'Alpha Arbutin 2% + HA',
    brand: 'The Ordinary',
    category: 'Serum',
    ingredients: 'Alpha Arbutin, Hyaluronic Acid',
  },
  {
    name: 'The Dewy Skin Cream',
    brand: 'Tatcha',
    category: 'Serum',
    ingredients: 'Japanese Purple Rice, Algae, Hadasei-3',
  },
  {
    name: 'Snail Mucin Power Essence',
    brand: 'COSRX',
    category: 'Serum',
    ingredients: 'Snail Secretion Filtrate, Sodium Hyaluronate',
  },

  // MOISTURIZERS (8 products)
  {
    name: 'Moisturizing Cream',
    brand: 'CeraVe',
    category: 'Moisturizer',
    ingredients: 'Ceramides, Hyaluronic Acid, Niacinamide',
  },
  {
    name: 'Daily Facial Moisturizer',
    brand: 'Cetaphil',
    category: 'Moisturizer',
    ingredients: 'Hyaluronic Acid, Vitamin E, Vitamin B5',
  },
  {
    name: 'Ultra Facial Cream',
    brand: 'Kiehl\'s',
    category: 'Moisturizer',
    ingredients: 'Squalane, Glacial Glycoprotein',
  },
  {
    name: 'Natural Moisturizing Factors + HA',
    brand: 'The Ordinary',
    category: 'Moisturizer',
    ingredients: 'Hyaluronic Acid, Amino Acids, Fatty Acids',
  },
  {
    name: 'Toleriane Double Repair Face Moisturizer',
    brand: 'La Roche-Posay',
    category: 'Moisturizer',
    ingredients: 'Ceramides, Niacinamide, Glycerin',
  },
  {
    name: 'Dramatically Different Moisturizing Gel',
    brand: 'Clinique',
    category: 'Moisturizer',
    ingredients: 'Hyaluronic Acid, Barley Extract, Cucumber',
  },
  {
    name: 'Water Sleeping Mask',
    brand: 'Laneige',
    category: 'Moisturizer',
    ingredients: 'Hydro Ionized Mineral Water, Apricot Extract',
  },
  {
    name: 'Oil-Free Gel Moisturizer',
    brand: 'Neutrogena',
    category: 'Moisturizer',
    ingredients: 'Hyaluronic Acid, Glycerin',
  },

  // SUNSCREENS (5 products)
  {
    name: 'Anthelios Melt-in Milk Sunscreen SPF 60',
    brand: 'La Roche-Posay',
    category: 'Sunscreen',
    ingredients: 'Avobenzone, Homosalate, Octisalate',
  },
  {
    name: 'Ultra Sheer Dry-Touch Sunscreen SPF 55',
    brand: 'Neutrogena',
    category: 'Sunscreen',
    ingredients: 'Avobenzone, Homosalate, Octisalate',
  },
  {
    name: 'UV Clear Broad-Spectrum SPF 46',
    brand: 'EltaMD',
    category: 'Sunscreen',
    ingredients: 'Zinc Oxide, Niacinamide, Hyaluronic Acid',
  },
  {
    name: 'Aqua Rich Watery Essence SPF 50+',
    brand: 'Biore',
    category: 'Sunscreen',
    ingredients: 'Octinoxate, Uvinul A Plus, Hyaluronic Acid',
  },
  {
    name: 'Mineral Sunscreen Fluid SPF 50',
    brand: 'CeraVe',
    category: 'Sunscreen',
    ingredients: 'Zinc Oxide, Titanium Dioxide, Ceramides',
  },

  // TREATMENTS (8 products)
  {
    name: 'Salicylic Acid 2% Solution',
    brand: 'The Ordinary',
    category: 'Treatment',
    ingredients: 'Salicylic Acid, Witch Hazel',
  },
  {
    name: 'AHA 30% + BHA 2% Peeling Solution',
    brand: 'The Ordinary',
    category: 'Treatment',
    ingredients: 'Glycolic Acid, Lactic Acid, Salicylic Acid',
  },
  {
    name: 'Benzoyl Peroxide 2.5%',
    brand: 'Paula\'s Choice',
    category: 'Treatment',
    ingredients: 'Benzoyl Peroxide',
  },
  {
    name: 'Azelaic Acid Suspension 10%',
    brand: 'The Ordinary',
    category: 'Treatment',
    ingredients: 'Azelaic Acid',
  },
  {
    name: 'Effaclar Duo Dual Action Acne Treatment',
    brand: 'La Roche-Posay',
    category: 'Treatment',
    ingredients: 'Benzoyl Peroxide, Lipo-Hydroxy Acid',
  },
  {
    name: 'Adapalene Gel 0.1%',
    brand: 'Differin',
    category: 'Treatment',
    ingredients: 'Adapalene',
  },
  {
    name: 'Luna Sleeping Night Oil',
    brand: 'Sunday Riley',
    category: 'Treatment',
    ingredients: 'Trans-Retinol Ester, Blue Tansy, German Chamomile',
  },
  {
    name: 'Good Genes All-In-One Lactic Acid Treatment',
    brand: 'Sunday Riley',
    category: 'Treatment',
    ingredients: 'Lactic Acid, Licorice, Lemongrass',
  },

  // EYE CREAMS (4 products)
  {
    name: 'Eye Repair Cream',
    brand: 'CeraVe',
    category: 'Eye Cream',
    ingredients: 'Ceramides, Hyaluronic Acid, Niacinamide',
  },
  {
    name: 'Caffeine Solution 5% + EGCG',
    brand: 'The Ordinary',
    category: 'Eye Cream',
    ingredients: 'Caffeine, EGCG from Green Tea',
  },
  {
    name: 'Midnight Recovery Eye',
    brand: 'Kiehl\'s',
    category: 'Eye Cream',
    ingredients: 'Squalane, Cucumber, Lavender',
  },
  {
    name: 'All About Eyes',
    brand: 'Clinique',
    category: 'Eye Cream',
    ingredients: 'Caffeine, Cucumber Extract',
  },

  // MASKS (3 products)
  {
    name: 'Clear Improvement Active Charcoal Mask',
    brand: 'Origins',
    category: 'Mask',
    ingredients: 'Bamboo Charcoal, White China Clay',
  },
  {
    name: 'Sheet Mask - Green Tea',
    brand: 'Innisfree',
    category: 'Mask',
    ingredients: 'Green Tea Extract, Hyaluronic Acid',
  },
  {
    name: 'Aztec Secret Indian Healing Clay',
    brand: 'Aztec Secret',
    category: 'Mask',
    ingredients: 'Bentonite Clay',
  },
];

async function main() {
  console.log('Starting seed...');

  // Check if products already exist
  const existingProductsCount = await prisma.product.count();

  if (existingProductsCount > 0) {
    console.log(`Database already contains ${existingProductsCount} products. Skipping seed.`);
    console.log('To re-seed, delete existing products first.');
    return;
  }

  // Create all products
  for (const product of starterProducts) {
    try {
      await prisma.product.create({
        data: product,
      });
      console.log(`✓ Created: ${product.name} (${product.brand})`);
    } catch (error) {
      console.error(`✗ Failed to create: ${product.name}`, error);
    }
  }

  console.log(`\n✓ Seeded ${starterProducts.length} starter products successfully!`);
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
