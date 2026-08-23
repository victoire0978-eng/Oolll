import React, { useState } from 'react';
import axios from 'axios';

export default function CreatorInfoModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [pw, setPw] = useState('');
  const [info, setInfo] = useState<any>(null);
  const [err, setErr] = useState('');

  async function submit() {
    try {
      const res = await axios.post('/api/creator-info', { password: pw });
      setInfo(res.data.creator);
      setErr('');
    } catch (e: any) {
      setErr(e?.response?.data?.error || 'Erreur');
    }
  }

  if (!visible) return null;
  return (
    <div className="modal">
      {!info ? (
        <div>
          <h3>Mot de passe requis</h3>
          <input value={pw} onChange={e => setPw(e.target.value)} type="password" />
          <button onClick={submit}>Valider</button>
          {err && <div className="error">{err}</div>}
        </div>
      ) : (
        <div>
          <h3>Infos du créateur</h3>
          <pre>{JSON.stringify(info,null,2)}</pre>
          <button onClick={onClose}>Fermer</button>
        </div>
      )}
    </div>
  );
}
