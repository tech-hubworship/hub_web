import { useEffect, useState } from 'react';

interface Cell {
  id: number;
  name: string;
}

export const useCells = (groupId: number | '') => {
  const [cells, setCells] = useState<Cell[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCells = async () => {
      setLoading(true);

      const query = new URLSearchParams(
        groupId ? { group_id: String(groupId) } : {}
      );

      const res = await fetch(`/api/common/cells?${query.toString()}`);
      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        console.error('셀 목록 조회 오류:', data.error);
        return;
      }

      let list = data.cells || [];

      // 🔥 "해당없음"을 맨 뒤로 보내는 정렬
      list = [
        ...list.filter((c: Cell) => c.name !== '해당없음'),
        ...list.filter((c: Cell) => c.name === '해당없음'),
      ];

      setCells(list);
    };

    fetchCells();
  }, [groupId]);

  return { cells, loading };
};
