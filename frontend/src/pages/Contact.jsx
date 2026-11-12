// Contact — simple enquiry form + office details.
import { useState } from 'react';
import { useToast } from '../App';

export default function Contact() {
  const toast = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !msg.trim()) { toast('Please fill in all fields.'); return; }
    setSent(true);
    toast('Message sent. We will reply within two working days.');
  };

  return (
    <section className="section" style={{ paddingTop: 48 }}>
      <div className="wrap grid2" style={{ alignItems: 'start' }}>
        <div>
          <p className="kicker"><span className="dot">●</span> Contact</p>
          <h1 className="display display-md" style={{ margin: '10px 0 16px' }}>Talk to us</h1>
          <p className="lede">Questions about the demo, a pilot for your school, or anything else. We read every message.</p>
          <div style={{ marginTop: 28, lineHeight: 2 }}>
            <p><strong>Learnzo Bharat Education Pvt. Ltd.</strong><br />Thane West, Maharashtra, India</p>
            <p>Email: hello@learnzo.in<br />For schools: schools@learnzo.in</p>
          </div>
        </div>
        <div className="card">
          {sent ? (
            <p>✓ Thanks, {name}. Your message is on its way.</p>
          ) : (
            <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="field"><label>Your name</label><input value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div className="field"><label>Message</label><textarea rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} /></div>
              <button className="btn btn-yellow" type="submit">Send message →</button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
