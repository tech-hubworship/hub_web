import { MenuTapList, MenuTapType } from '../types';

export const menuTapList: MenuTapList = [
  {
    type: MenuTapType.DEFAULT,
    title: '설문',
    href: '/Survey',
    auth: true
  },
  {
    type: MenuTapType.DEFAULT,
    title: '내 페이지',
    href: '/Info',
    auth: true
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
