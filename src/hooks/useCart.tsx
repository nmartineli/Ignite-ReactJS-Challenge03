import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      let newCart;

      const addedProductData = await api
        .get(`/products/${productId}`)
        .then((response) => response.data);

      let addedProduct = { ...addedProductData, amount: 1 };

      const cartProductIndex = cart.findIndex(
        (item) => item.id == addedProductData.id
      );

      const stock = await api
        .get(`stock/${productId}`)
        .then((response) => response.data.amount);

      if (cartProductIndex !== -1) {
        let previouslyAddedProduct = cart[cartProductIndex];

        if (previouslyAddedProduct.amount + 1 <= stock) {
          previouslyAddedProduct.amount += 1;
          addedProduct = previouslyAddedProduct;
          newCart = cart.filter((item) => item != previouslyAddedProduct);
        } else {
          throw toast.error('Quantidade solicitada fora de estoque');
        }
      } else {
        newCart = cart;
      }

      setCart([...newCart, addedProduct]);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const storagedCartData = JSON.parse(
        localStorage.getItem('@RocketShoes:cart') || '{}'
      );

      const updatedCart = storagedCartData.filter(
        (product: Product) => product.id != productId
      );

      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      const storagedCartData = JSON.parse(
        localStorage.getItem('@RocketShoes:cart') || '{}'
      );

      const stock = await api
        .get(`stock/${productId}`)
        .then((response) => response.data.amount);

      if (amount > stock) {
        return toast.error('Quantidade solicitada fora de estoque');
      }

      if (amount <= 0) {
        return;
      }

      const updatedCart = storagedCartData.map((product: Product) => {
        if (product.id === productId) {
          return {
            ...product,
            amount: amount,
          };
        } else {
          return product;
        }
      });
      setCart(updatedCart);

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
function updatedItem(updatedItem: any) {
  throw new Error('Function not implemented.');
}
