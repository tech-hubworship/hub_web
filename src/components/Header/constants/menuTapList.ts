import { MenuTapList, MenuTapType } from '../types';

export const menuTapList: MenuTapList = [
  // {
  //   type: MenuTapType.SPECIAL,
  //   title: '앱',
  //   href: '/apps',
  //   auth: false
  // },
  {
    type: MenuTapType.DEFAULT,
    title: '내 정보',
    href: '/myinfo',
    auth: true
  }
];
