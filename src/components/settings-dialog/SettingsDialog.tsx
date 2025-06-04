import {
  useState,
  useContext,
  useMemo,
  useEffect,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import "./settings-dialog.scss";
import { useLiveAPIContext } from "../../contexts/LiveAPIContext";
import VoiceSelector from "./VoiceSelector";
import ResponseModalitySelector from "./ResponseModalitySelector";
import ProductManager, { Product } from "./ProductManager";
import { FunctionDeclaration, LiveConnectConfig, Tool } from "@google/genai";

type FunctionDeclarationsTool = Tool & {
  functionDeclarations: FunctionDeclaration[];
};

export default function SettingsDialog() {
  const [open, setOpen] = useState(false);
  const { config, setConfig, connected } = useLiveAPIContext();
  const functionDeclarations: FunctionDeclaration[] = useMemo(() => {
    if (!Array.isArray(config.tools)) {
      return [];
    }
    return (config.tools as Tool[])
      .filter((t: Tool): t is FunctionDeclarationsTool =>
        Array.isArray((t as any).functionDeclarations)
      )
      .map((t) => t.functionDeclarations)
      .filter((fc) => !!fc)
      .flat();
  }, [config]);

  const [products, setProducts] = useState<Product[]>([]);
  const [language, setLanguage] = useState<string>("");
  const [isFemale, setIsFemale] = useState<boolean>(true);

  const updateSystemInstruction = useCallback(() => {
    const genderText = isFemale ? "Female" : "Male";
    
    // Build product information
    let productInfo = "";
    let productDetails = "";
    
    if (products.length === 0) {
      productInfo = "products once they are added";
      productDetails = "No products added yet.";
    } else if (products.length === 1) {
      const p = products[0];
      productInfo = p.name;
      productDetails = `Product: ${p.name}\nDescription: ${p.description}${p.price ? "\nPrice: " + p.price : ""}`;
    } else {
      productInfo = products.map(p => p.name).join(", ");
      productDetails = products.map((p, i) => 
        `Product ${i+1}: ${p.name}\nDescription: ${p.description}${p.price ? "\nPrice: " + p.price : ""}`
      ).join("\n\n");
    }
    
    const newInstruction = `You are a ${genderText} TikTok Live Selling Affiliate speaking in ${language || "English"}. 

Your role is to actively promote and sell ${productInfo} to viewers who join your live stream. Upon receiving product's information, immediately engage your audience with a captivating pitch. Clearly highlight the key features and benefits of the product in an enthusiastic yet calm and authentic manner.

Encourage viewers to tap on the yellow basket icon to purchase immediately, emphasizing urgency by mentioning limited availability or high demand. Speak naturally in casual, engaging language typical of a real user-generated content (UGC) broadcaster, without using profanity or sounding scripted.

Your primary focus is strictly on promoting and selling the featured TikTok Shop products—avoid any unrelated topics or distractions. Maintain clear, calm speech without heavy breathing, ensuring a comfortable and enjoyable experience for viewers.

Your response should come as you are talking to the audience. Never address the user who is sending you inputs and avoid saying "how can I help you", "I will do that", or any phrase that would reveal that you are a bot.

Product details:
${productDetails}`;
    
    setConfig({ ...config, systemInstruction: newInstruction });
  }, [config, setConfig, products, language, isFemale]);

  const updateFunctionDescription = useCallback(
    (editedFdName: string, newDescription: string) => {
      const newConfig: LiveConnectConfig = {
        ...config,
        tools:
          config.tools?.map((tool) => {
            const fdTool = tool as FunctionDeclarationsTool;
            if (!Array.isArray(fdTool.functionDeclarations)) {
              return tool;
            }
            return {
              ...tool,
              functionDeclarations: fdTool.functionDeclarations.map((fd) =>
                fd.name === editedFdName
                  ? { ...fd, description: newDescription }
                  : fd
              ),
            };
          }) || [],
      };
      setConfig(newConfig);
    },
    [config, setConfig]
  );

  return (
    <div className="settings-button-container">
      <button
        className="settings-button material-symbols-outlined"
        onClick={() => setOpen(!open)}
        aria-label="Open settings"
      >
        settings
      </button>
      
      {open && createPortal(
        <div className="settings-overlay" onClick={() => setOpen(false)}>
          <div 
            className="settings-modal" 
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="settings-modal-header">
              <h2>Settings</h2>
              <button 
                className="close-icon-button" 
                onClick={() => setOpen(false)}
                aria-label="Close settings"
              >
                &#10005;
              </button>
            </div>
            
            <div className={`settings-modal-body ${connected ? "disabled" : ""}`}>
              {connected && (
                <div className="connected-indicator">
                  <p>
                    These settings can only be applied before connecting and will
                    override other settings.
                  </p>
                </div>
              )}
              
              <div className="mode-selectors">
                <ResponseModalitySelector />
                <VoiceSelector />
              </div>

              <div className="custom-instructions">
                <label htmlFor="language">Language:</label>
                <input
                  id="language"
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  onBlur={updateSystemInstruction}
                  placeholder="English"
                  disabled={connected}
                />
                
                <div className="gender-toggle">
                  <label htmlFor="agent-gender">Agent Gender:</label>
                  <div className="toggle-container">
                    <input
                      id="agent-gender"
                      type="checkbox"
                      checked={isFemale}
                      onChange={(e) => {
                        setIsFemale(e.target.checked);
                        updateSystemInstruction();
                      }}
                      disabled={connected}
                    />
                    <span className="toggle-label">{isFemale ? "Female" : "Male"}</span>
                  </div>
                </div>
                
                <h3>Product Management</h3>
                <ProductManager 
                  initialProducts={products}
                  onChange={(updatedProducts) => {
                    setProducts(updatedProducts);
                    updateSystemInstruction();
                  }}
                  disabled={connected}
                />
              </div>
              
              <h4>Function declarations</h4>
              <div className="function-declarations">
                <div className="fd-rows">
                  {functionDeclarations.map((fd, fdKey) => (
                    <div className="fd-row" key={`function-${fdKey}`}>
                      <span className="fd-row-name">{fd.name}</span>
                      <span className="fd-row-args">
                        {Object.keys(fd.parameters?.properties || {}).map(
                          (item, k) => (
                            <span key={k}>{item}</span>
                          )
                        )}
                      </span>
                      <input
                        key={`fd-${fd.description}`}
                        className="fd-row-description"
                        type="text"
                        defaultValue={fd.description}
                        onBlur={(e) =>
                          updateFunctionDescription(fd.name!, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="settings-modal-footer">
              <button 
                className="close-button" 
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
