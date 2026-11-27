import { ArrowRight, BookOpen, Coffee, Heart, Lightbulb } from "lucide-react";
import { GiftFinder } from "./GiftFinder";
export function giftSample(category: string, productId?:string) {
  if(productId && ["frames","canvas","wooden","prints"].includes(category)){const samples=["family","wedding","baby","engagement","anniversary"];return "/products/frame-sample-"+samples[Number(productId.match(/\d+$/)?.[0]||0)%samples.length]+".jpg";}
  return category === "drinkware" ? "/products/mug-sample-couple.jpg" : category === "led" ? "/products/translight-sample.jpg" : category === "gods-collection" ? "/deities/shrinathji.jpg" : category === "albums" || category === "magazines" ? "/products/magazine-cover.jpg" : category === "acrylic" ? "/products/frame-sample-anniversary.jpg" : category === "prints" ? "/products/frame-sample-baby.jpg" : "/products/frame-sample-family.jpg";
}
export function GiftDiscovery({ onCategory, onOccasion, onRecipient, onBudget, onProduct }: {
  onCategory: (id: string) => void; onOccasion: (id: string) => void; onRecipient: (id: string) => void; onBudget: (value: number | null) => void; onProduct: (id: string) => void;
}) {
  return <div className="gift-discovery ed-wrap">
    <div className="gift-collection-stories">{[
      {category:"drinkware",icon:Coffee,title:"Your everyday, made personal.",text:"See your photograph wrap around a rotating photo mug.",label:"Photo mugs"},
      {category:"led",icon:Lightbulb,title:"Let a memory light up.",text:"Try the light, change the mood and fit your favourite photo.",label:"LED & translights"},
      {category:"albums",icon:BookOpen,title:"A story you can turn to.",text:"Explore a personal magazine, page by page.",label:"Albums & photo stories"},
    ].map(c=><button className="gift-story-card" key={c.category} onClick={()=>onCategory(c.category)}><img src={giftSample(c.category)} alt={`${c.label} sample artwork`} loading="lazy"/><div><c.icon size={19}/><h2>{c.title}</h2><p>{c.text}</p><span>{c.label}<ArrowRight size={15}/></span></div></button>)}</div>
    <div className="gift-collection-links"><div><strong>By occasion</strong>{["Birthday","Anniversary","Family","Corporate"].map(x=><button key={x} onClick={()=>onOccasion(x)}>{x}</button>)}</div><div><strong>For someone special</strong>{["Couples","Parents","Friends","Teams"].map(x=><button key={x} onClick={()=>onRecipient(x)}>{x}</button>)}</div><div><strong>Find your budget</strong>{[399,799,1499,2999,5799].map(x=><button key={x} onClick={()=>onBudget(x)}>Up to ₹{x.toLocaleString("en-IN")}</button>)}<button onClick={()=>onBudget(null)}>All budgets</button></div></div>
    <details className="gift-finder-panel"><summary><Heart size={16}/>A little help finding a thoughtful gift <span>Open gift finder +</span></summary><GiftFinder onSelectProduct={onProduct}/></details>
  </div>;
}
