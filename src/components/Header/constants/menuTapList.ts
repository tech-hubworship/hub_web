import { MenuTapList, MenuTapType } from '../types';

export const menuTapList: MenuTapList = [
  {
    type: MenuTapType.SPECIAL,
    title: '플레이',
    href: '/play',
    auth: false
  },
  {
    type: MenuTapType.DEFAULT,
    title: '내 정보',
    href: '/myinfo',
    auth: true
  }
];
