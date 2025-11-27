// 파일: src/pages/api/common/cells.ts

import { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@src/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { group_id } = req.query;

  try {
    let query = supabaseAdmin.from("hub_cells").select("id, name, group_id");

    if (group_id) {
      query = query.eq("group_id", Number(group_id));
    }

    const { data, error } = await query.order("name", { ascending: true });

    if (error) {
      console.error("cells api error:", error);
      return res.status(500).json({ error: "셀 조회 실패" });
    }

    return res.status(200).json({ cells: data });
  } catch (err) {
    console.error("cells api exception:", err);
    return res.status(500).json({ error: "서버 에러" });
  }
}
