import React from 'react';
import titleImage from '../../../assets/optimized/skin-anvil.png';

const Header = () => (
  <header className="mb-4 sm:mb-8">
    <img
      src={titleImage}
      alt="Skin Anvil"
      className="mx-auto max-w-full max-h-20 sm:max-h-32"
    />
    <p className="text-center mt-2 sm:mt-4 px-2 sm:px-4">
      <span className="font-minecraft text-text-white bg-black/50 inline-block px-2 py-1 text-xs sm:text-sm md:text-base">
        Add up to 4 skins, choose which body parts to use, and forge them into a new skin.
      </span>
    </p>
  </header>
);

export default React.memo(Header);
