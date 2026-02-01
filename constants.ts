import { ImageAsset } from './types';

export const PRESET_PERSON_IMAGES: ImageAsset[] = [
  {
    id: 'p1',
    url: 'https://p1.ssl.qhimg.com/t016f3f01da12c3fec7.jpg',
    type: 'preset',
  },
  {
    id: 'p2',
    url: 'https://picsum.photos/id/64/800/1000',
    type: 'preset',
  },
  {
    id: 'p3',
    url: 'https://picsum.photos/id/338/800/1000',
    type: 'preset',
  }
];

export const PRESET_CLOTHING_IMAGES: ImageAsset[] = [
  {
    id: 'c1',
    url: 'https://th.bing.com/th/id/OIP._QL4rw1fOr5BJDMGs7lMNwHaNJ?o=7rm=3&rs=1&pid=ImgDetMain&o=7&rm=3',
    type: 'preset',
  },
  {
    id: 'c2',
    url: 'https://picsum.photos/id/447/800/800', // Placeholder allowing logic to work
    type: 'preset',
  }
];

export const STEP_DESCRIPTIONS = {
  1: '选择模特',
  2: '选择服装',
  3: '生成效果',
};