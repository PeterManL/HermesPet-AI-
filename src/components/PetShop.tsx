import React from "react";
import { ShoppingBag, Coins, Sparkles, Heart } from "lucide-react";
import { FoodItem, PetStats } from "../types";
import { SHOP_ITEMS } from "../data";

interface PetShopProps {
  petStats: PetStats;
  onPurchaseAndFeed: (food: FoodItem) => void;
  onClose: () => void;
}

export default function PetShop({
  petStats,
  onPurchaseAndFeed,
  onClose
}: PetShopProps) {
  return (
    <div className="flex flex-col h-full bg-white border-2 border-indigo-100 rounded-3xl overflow-hidden shadow-xl text-slate-800">
      {/* Header Bar */}
      <div className="flex justify-between items-center bg-indigo-50/80 border-b-2 border-indigo-100/60 px-5 py-3 select-none">
        <div className="flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="font-sans text-xs font-black tracking-wide text-indigo-950">
            数码零食铺与健康补给站
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-bold text-indigo-500 hover:text-indigo-700 bg-indigo-100/50 hover:bg-indigo-100 py-1 px-2.5 rounded-lg transition-colors"
        >
          收起
        </button>
      </div>

      {/* Coins Indicator panel (Vibrant Palette gradient) */}
      <div className="bg-gradient-to-r from-yellow-400/10 to-indigo-50/20 p-4 border-b-2 border-indigo-100/50 flex justify-between items-center select-none">
        <div>
          <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
            主人的 Cyber 余额储备
          </div>
          <div className="text-lg font-black text-slate-800 flex items-center gap-1.5 mt-0.5">
            <Coins className="w-5 h-5 text-yellow-500 fill-yellow-400" />
            <span>{petStats.coins} <span className="text-xs font-bold text-slate-400">Cyber 币</span></span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] bg-white border-2 border-indigo-100 text-indigo-800 font-bold py-1 px-3 rounded-full shadow-sm">
            宠物胃部容量: {petStats.hunger} / 100
          </span>
        </div>
      </div>

      {/* Shop items list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-indigo-100">
        <div className="text-[10px] text-slate-400 leading-relaxed font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          💡 主人可以通过协同完成待办计划、与宠物对话来累积 Cyber 币。在此处购买美食喂投，可即时补充宠物胃容量、精力储备，并大幅改善宠物心情！
        </div>

        <div className="space-y-3">
          {SHOP_ITEMS.map((item) => {
            const canAfford = petStats.coins >= item.cost;
            const isFull = petStats.hunger >= 98 && item.hungerRestore > 0;

            return (
              <div 
                key={item.id} 
                className={`bg-white hover:bg-slate-50/50 border-2 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                  canAfford 
                    ? "border-slate-100 hover:border-indigo-150 hover:shadow-md hover:shadow-indigo-50/40" 
                    : "border-slate-100 opacity-60"
                }`}
              >
                {/* Food Details */}
                <div className="flex gap-4.5 items-start min-w-0">
                  <span className="text-3xl select-none shrink-0 bg-indigo-50/40 p-3 rounded-2xl border-2 border-indigo-100/50 flex items-center justify-center w-14 h-14 shadow-sm">
                    {item.emoji}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-800 block truncate">
                      {item.name}
                    </span>
                    <p className="text-[10px] text-slate-400 mt-1 leading-normal font-medium max-w-[220px]">
                      {item.description}
                    </p>
                    
                    {/* Nutritional Stats */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {item.hungerRestore > 0 && (
                        <span className="text-[9px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded-lg border border-amber-200/50 font-bold">
                          饱食度 +{item.hungerRestore}
                        </span>
                      )}
                      {item.moodRestore > 0 && (
                        <span className="text-[9px] bg-rose-500/10 text-rose-700 px-1.5 py-0.5 rounded-lg border border-rose-200/50 font-bold">
                          好感度 +{item.moodRestore}
                        </span>
                      )}
                      {item.energyRestore > 0 && (
                        <span className="text-[9px] bg-cyan-500/10 text-cyan-700 px-1.5 py-0.5 rounded-lg border border-cyan-200/50 font-bold">
                          精力 +{item.energyRestore}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Purchase Button (Vibrant Palette Theme styled) */}
                <button
                  onClick={() => onPurchaseAndFeed(item)}
                  disabled={!canAfford || isFull}
                  className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                    isFull
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                      : canAfford 
                        ? "bg-[#FFE66D] hover:bg-yellow-400 text-slate-900 shadow-md shadow-yellow-100/80 active:scale-95" 
                        : "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  <Coins className="w-3.5 h-3.5 text-slate-700" />
                  <span>
                    {isFull 
                      ? "肚子饱饱的" 
                      : `${item.cost} Cyber币`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
