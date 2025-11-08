import {
  ShoppingBag,
  Facebook,
  Globe,
  ShoppingCart,
  Video,
  Box,
  MessageSquare,
  Headphones,
} from "lucide-react";

export default function Integration() {
  return (
    <>
    {/* Download Section */}
      <div className="container px-4 pt-4 pb-3">
        <p className="text-md font-semibold md:text-2xl font-custom">
          Download Apps :
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        <div className="flex flex-col items-center bg-[#dbfce7] justify-center p-4 border-1 border-[#aff2c9] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#aff2c9] mb-2">
            <ShoppingCart size={24} className="text-[#00c951] " />
          </div>
          <p className="text-medium font-medium font-custom">Shopify</p>
        </div>
      </div>

   {/* Products Section */}
      <div className="container p-4">
        <p className="text-md font-semibold md:text-2xl font-custom">
          Products Apps :
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
        <div className="flex flex-col items-center justify-center p-4 border-1 border-[#ffd3aa] bg-[#ffedd4] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ffd3aa] mb-2">
            <ShoppingBag size={24} className=" text-[#f57c0b]" />
          </div>
          <p className="text-medium font-medium font-custom">Magento</p>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#daedff] p-4 border-1 border-[#b9dbfe] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#b9dbfe] mb-2">
            <Facebook size={24} className="text-[#1786f5]" />
          </div>
          <p className="text-medium font-medium font-custom">Facebook</p>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#fef9c2] p-4 border-1 border-[#fbeb9b] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center bg-[#fbeb9b] justify-center rounded-full  mb-2">
            <Globe size={24} className="text-[#f3bf26]" />
          </div>
          <p className="text-medium font-medium font-custom">Google</p>
        </div>

        <div className="flex flex-col items-center justify-center p-4 border-1 border-[#e5c8ff] bg-[#f3e8ff] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#e5c8ff] mb-2">
            <Video size={24} className="text-[#ad46ff]" />
          </div>
          <p className="text-medium font-medium font-custom">TikTok</p>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#ffe0e1] p-4 border-1 border-[#ffcdcf] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#ffcdcf] mb-2">
            <Box size={24} className="text-[#eb6a6f]" />
          </div>
          <p className="text-medium font-medium font-custom">Amazon</p>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#fdf2f8] p-4 border-1 border-[#fbcfe8] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#fbcfe8] mb-2">
            <MessageSquare size={24} className="text-[#db2777]" />
          </div>
          <p className="text-medium font-medium font-custom">Slack</p>
        </div>

        <div className="flex flex-col items-center justify-center bg-[#eef2ff] p-4 border-1 border-[#c7d2fe] rounded-lg shadow-sm">
          <div className="w-12 h-12 flex items-center justify-center rounded-full bg-[#c7d2fe] mb-2">
            <Headphones size={24} className="text-[#4f46e5]" />
          </div>
          <p className="text-medium font-medium font-custom">Discord</p>
        </div>
      </div>
    </>
  );
}
