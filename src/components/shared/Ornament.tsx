import Image from "next/image";

export default function Ornament() {
  return (
    <div className="flex justify-center py-10">
      <Image
        src="/images/logo.png"
        alt=""
        width={30}
        height={30}
        className="opacity-20"
        aria-hidden="true"
      />
    </div>
  );
}
