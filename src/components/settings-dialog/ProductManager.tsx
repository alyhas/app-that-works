import { useState, useEffect } from "react";
import "./product-manager.scss";

export interface Product {
  id: string;
  name: string;
  description: string;
  price?: string;
  imageUrl?: string;
}

interface ProductManagerProps {
  initialProducts?: Product[];
  onChange: (products: Product[]) => void;
  disabled?: boolean;
}

export default function ProductManager({ initialProducts = [], onChange, disabled = false }: ProductManagerProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (initialProducts.length > 0 && !selectedProductId) {
      setSelectedProductId(initialProducts[0].id);
    }
  }, [initialProducts, selectedProductId]);

  const handleAddProduct = () => {
    if (products.length >= 100) {
      alert("Maximum 100 products allowed");
      return;
    }
    
    const newProduct: Product = {
      id: `product-${Date.now()}`,
      name: "",
      description: ""
    };
    
    const updatedProducts = [...products, newProduct];
    setProducts(updatedProducts);
    setSelectedProductId(newProduct.id);
    setShowForm(true);
    onChange(updatedProducts);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    const updatedProducts = products.map(product => 
      product.id === updatedProduct.id ? updatedProduct : product
    );
    setProducts(updatedProducts);
    onChange(updatedProducts);
  };

  const handleRemoveProduct = (id: string) => {
    const updatedProducts = products.filter(product => product.id !== id);
    setProducts(updatedProducts);
    
    if (selectedProductId === id) {
      setSelectedProductId(updatedProducts.length > 0 ? updatedProducts[0].id : null);
    }
    
    onChange(updatedProducts);
  };

  const selectedProduct = products.find(p => p.id === selectedProductId) || null;

  return (
    <div className="product-manager">
      <div className="product-list">
        <div className="list-header">
          <h3>Products ({products.length}/100)</h3>
          <button 
            className="add-product-btn"
            onClick={handleAddProduct}
            disabled={disabled || products.length >= 100}
            aria-label="Add product"
          >
            + Add
          </button>
        </div>
        <div className="product-items-container">
          {products.length > 0 ? (
            <ul className="product-items">
              {products.map(product => (
                <li 
                  key={product.id} 
                  className={`product-item ${selectedProductId === product.id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedProductId(product.id);
                    setShowForm(true);
                  }}
                >
                  <span className="product-name">{product.name || "Unnamed Product"}</span>
                  <button 
                    className="remove-product-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProduct(product.id);
                    }}
                    disabled={disabled}
                    aria-label="Remove product"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="no-products">No products yet</div>
          )}
        </div>
      </div>

      {showForm && selectedProduct && (
        <div className="product-form">
          <div className="form-header">
            <h3>{selectedProduct.name ? `Edit: ${selectedProduct.name}` : 'New Product'}</h3>
            <div className="mobile-actions">
              {products.length > 1 && (
                <button 
                  className="mobile-nav-btn prev" 
                  onClick={() => {
                    const currentIndex = products.findIndex(p => p.id === selectedProductId);
                    const prevIndex = (currentIndex - 1 + products.length) % products.length;
                    setSelectedProductId(products[prevIndex].id);
                  }}
                  disabled={disabled}
                >
                  ←
                </button>
              )}
              {products.length > 1 && (
                <button 
                  className="mobile-nav-btn next" 
                  onClick={() => {
                    const currentIndex = products.findIndex(p => p.id === selectedProductId);
                    const nextIndex = (currentIndex + 1) % products.length;
                    setSelectedProductId(products[nextIndex].id);
                  }}
                  disabled={disabled}
                >
                  →
                </button>
              )}
              <button 
                className="mobile-remove-btn"
                onClick={() => handleRemoveProduct(selectedProduct.id)}
                disabled={disabled}
              >
                Delete
              </button>
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="product-name">Name:</label>
            <input
              id="product-name"
              type="text"
              value={selectedProduct.name}
              onChange={(e) => handleUpdateProduct({
                ...selectedProduct,
                name: e.target.value
              })}
              placeholder="Product name"
              disabled={disabled}
              maxLength={100}
            />
          </div>

          <div className="form-group">
            <label htmlFor="product-description">Description:</label>
            <textarea
              id="product-description"
              value={selectedProduct.description}
              onChange={(e) => handleUpdateProduct({
                ...selectedProduct,
                description: e.target.value
              })}
              placeholder="Enter detailed product description..."
              rows={5}
              disabled={disabled}
              maxLength={1000}
            />
          </div>

          <div className="form-fields-row">
            <div className="form-group">
              <label htmlFor="product-price">Price (optional):</label>
              <input
                id="product-price"
                type="text"
                value={selectedProduct.price || ""}
                onChange={(e) => handleUpdateProduct({
                  ...selectedProduct,
                  price: e.target.value
                })}
                placeholder="e.g. $19.99"
                disabled={disabled}
              />
            </div>

            <div className="form-group">
              <label htmlFor="product-image">Image URL (optional):</label>
              <input
                id="product-image"
                type="text"
                value={selectedProduct.imageUrl || ""}
                onChange={(e) => handleUpdateProduct({
                  ...selectedProduct,
                  imageUrl: e.target.value
                })}
                placeholder="https://example.com/image.jpg"
                disabled={disabled}
              />
            </div>
          </div>
          
          {selectedProduct.imageUrl && (
            <div className="image-preview">
              <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
