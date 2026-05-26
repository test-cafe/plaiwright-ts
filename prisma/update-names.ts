import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Categories are matched by ID (1-5, seeded in order)
const categoryNames: Record<number, string> = {
  1: 'Pizzas',
  2: 'Breakfast',
  3: 'Snacks',
  4: 'Milkshakes',
  5: 'Drinks',
};

// Products matched by imageUrl (stable across re-seeds)
const productNames: Record<string, string> = {
  'https://media.dodostatic.net/image/r:292x292/11EE7970321044479C1D1085457A36EB.webp': 'Sausage and mushroom omelette',
  'https://media.dodostatic.net/image/r:292x292/11EE94ECF33B0C46BA410DEC1B1DD6F8.webp': 'Pepperoni omelette',
  'https://media.dodostatic.net/image/r:292x292/11EE7D61B0C26A3F85D97A78FEEE00AD.webp': 'Latte Coffee',
  'https://media.dodostatic.net/image/r:292x292/11EE796FF0059B799A17F57A9E64C725.webp': 'Turkey and cheese sandwich',
  'https://media.dodostatic.net/image/r:292x292/11EE7D618B5C7EC29350069AE9532C6E.webp': 'Chicken nuggets',
  'https://media.dodostatic.net/image/r:292x292/11EED646A9CD324C962C6BEA78124F19.webp': 'Oven-baked potatoes with sauce 🌱',
  'https://media.dodostatic.net/image/r:292x292/11EE796F96D11392A2F6DD73599921B9.webp': 'Dodster',
  'https://media.dodostatic.net/image/r:292x292/11EE796FD3B594068F7A752DF8161D04.webp': 'Spicy Dodster 🌶️🌶️',
  'https://media.dodostatic.net/image/r:292x292/11EEE20B8772A72A9B60CFB20012C185.webp': 'Banana milkshake',
  'https://media.dodostatic.net/image/r:292x292/11EE79702E2A22E693D96133906FB1B8.webp': 'Caramel apple milkshake',
  'https://media.dodostatic.net/image/r:292x292/11EE796FA1F50F8F8111A399E4C1A1E3.webp': 'Oreo cookie milkshake',
  'https://media.dodostatic.net/image/r:292x292/11EE796F93FB126693F96CB1D3E403FB.webp': 'Classic milkshake 👶',
  'https://media.dodostatic.net/image/r:292x292/11EE7D61999EBDA59C10E216430A6093.webp': 'Irish Cappuccino',
  'https://media.dodostatic.net/image/r:292x292/11EE7D61AED6B6D4BFDAD4E58D76CF56.webp': 'Caramel cappuccino',
  'https://media.dodostatic.net/image/r:292x292/11EE7D61B19FA07090EE88B0ED347F42.webp': 'Coconut latte',
  'https://media.dodostatic.net/image/r:292x292/11EE7D61B044583596548A59078BBD33.webp': 'Americano',
  // Latte shares imageUrl with "Latte Coffee" above — handled by name below
  'https://media.dodostatic.net/image/r:233x233/11EE7D61304FAF5A98A6958F2BB2D260.webp': 'Pepperoni Fresh',
  'https://media.dodostatic.net/image/r:233x233/11EE7D610CF7E265B7C72BE5AE757CA7.webp': 'Cheese Pizza',
  'https://media.dodostatic.net/image/r:584x584/11EE7D61706D472F9A5D71EB94149304.webp': 'Chorizo Fresh',
};

// Ingredients matched by imageUrl (stable, assigned id 1..17 in seed order)
const ingredientNames: Record<string, string> = {
  'https://cdn.dodostatic.net/static/Img/Ingredients/99f5cb91225b4875bd06a26d2e842106.png': 'Cheese crust',
  'https://cdn.dodostatic.net/static/Img/Ingredients/cdea869ef287426386ed634e6099a5ba.png': 'Creamy mozzarella',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA69C1FE796': 'Cheddar and parmesan',
  'https://cdn.dodostatic.net/static/Img/Ingredients/11ee95b6bfdf98fb88a113db92d7b3df.png': 'Spicy jalapeño pepper',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA5B328D35A': 'Tender chicken',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA67259A324': 'Mushrooms',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA61B9A8D61': 'Pepperoni',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA6258199C3': 'Spicy pepperoni',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA62D5D6027': 'Spicy chorizo',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A21DA51A81211E9EA89958D782B': 'Pickled cucumbers',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA7AC1A1D67': 'Fresh tomatoes',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA60AE6464C': 'Red onion',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A21DA51A81211E9AFA6795BA2A0': 'Juicy pineapples',
  'https://cdn.dodostatic.net/static/Img/Ingredients/370dac9ed21e4bffaf9bc2618d258734.png': 'Italian herbs',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A22FA54A81411E9AFA63F774C1B': 'Sweet pepper',
  'https://cdn.dodostatic.net/static/Img/Ingredients/000D3A39D824A82E11E9AFA6B0FFC349': 'Feta cheese cubes',
  'https://cdn.dodostatic.net/static/Img/Ingredients/b2f3a5d5afe44516a93cfc0d2ee60088.png': 'Meatballs',
};

async function main() {
  console.log('Updating category names...');
  for (const [id, name] of Object.entries(categoryNames)) {
    const result = await prisma.category.updateMany({
      where: { id: Number(id) },
      data: { name },
    });
    console.log(`  Category ${id} → "${name}" (${result.count} updated)`);
  }

  console.log('\nUpdating product names...');
  for (const [imageUrl, name] of Object.entries(productNames)) {
    const result = await prisma.product.updateMany({
      where: { imageUrl },
      data: { name },
    });
    console.log(`  "${name}" (${result.count} updated)`);
  }

  // "Latte" shares imageUrl with "Latte Coffee" — update by categoryId to distinguish
  const latteResult = await prisma.product.updateMany({
    where: {
      imageUrl: 'https://media.dodostatic.net/image/r:292x292/11EE7D61B0C26A3F85D97A78FEEE00AD.webp',
      categoryId: 5,
    },
    data: { name: 'Latte' },
  });
  console.log(`  "Latte" (drinks category) (${latteResult.count} updated)`);

  console.log('\nUpdating ingredient names...');
  for (const [imageUrl, name] of Object.entries(ingredientNames)) {
    const result = await prisma.ingredient.updateMany({
      where: { imageUrl },
      data: { name },
    });
    console.log(`  "${name}" (${result.count} updated)`);
  }

  console.log('\nDone. No data was deleted.');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
