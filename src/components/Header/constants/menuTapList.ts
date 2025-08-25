import { MenuTapList, MenuTapType } from '../types';

export const menuTapList: MenuTapList = [
  {
    type: MenuTapType.DEFAULT,
    title: '내 정보',
    href: '/myinfo',
  },
  {
    type: MenuTapType.DEFAULT,
    title: '티셔츠 예약',
    href: '/tshirt',
  },
  {
    type: MenuTapType.DEFAULT,
    title: '분실물',
    href: '/lost-items',
  },
  {
    type: MenuTapType.DEFAULT,
    title: '공지사항',
    href: '/announcements',
  },
  {
    type: MenuTapType.DEFAULT,
    title: '식단표',
    href: '/meals',
  },
];
