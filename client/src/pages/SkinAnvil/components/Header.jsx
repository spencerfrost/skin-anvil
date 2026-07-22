import React from 'react';
import titleImage from '../../../assets/optimized/title.png';

const Header = () => (
  <header className="mb-4 sm:mb-8">
    <img
      src={titleImage}
      alt="Skin Anvil"
      className="mx-auto max-w-full"
    />
    <p className="text-center mt-2 sm:mt-4 flex justify-center px-2 sm:px-4">
      <span className="font-minecraft text-text-white relative px-2 py-1 text-xs sm:text-sm md:text-base">
        <span className="relative z-10">
          Add up to 4 skins, select the body parts, and then merge them together
          to create a new skin.
        </span>
        <span
          className="absolute inset-0 bg-black opacity-50"
          aria-hidden="true"
        />
      </span>
    </p>
  </header>
);

export default React.memo(Header);
