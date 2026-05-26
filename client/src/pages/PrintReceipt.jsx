import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function PrintReceipt() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      const response = await api.getSale(id)
      setOrder(response.data)
    } catch (error) {
      alert('載入訂單失敗')
      window.close()
    } finally {
      setLoading(false)
    }
  }

  // 核心：Iframe 沙盒列印
  const handlePrint = () => {
    const printContent = document.getElementById('receipt-print-area').innerHTML;
    
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <html>
        <head>
          <title>銷售收據 - ${order?.order_number}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: "Courier New", "Menlo", "Monaco", Consolas, "Liberation Mono", monospace;
              font-size: 13px;
              line-height: 1.4;
              background: white;
              color: black;
              margin: 0;
              padding: 0;
            }
            @page {
              size: 8.5in 5.5in; /* 嚴格鎖定中一刀點陣紙尺寸 */
              margin: 0;
            }
            .receipt {
              width: 8.5in;
              height: 5.5in;
              padding: 15px 35px;
              page-break-after: always;
              box-sizing: border-box;
              background: white;
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }
            .header { text-align: center; padding-bottom: 4px; margin-bottom: 2px; border-bottom: 1px dashed #000; }
            .header h1 { font-weight: bold; font-size: 18px; margin-bottom: 2px; }
            .header p { font-size: 12px; }
            .line { text-align: center; margin: 3px 0; font-size: 13px; }
            
            .info-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
            .details-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
            .details-table th, .details-table td { 
              padding: 3px 0; 
              height: 22px; 
              line-height: 16px;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis; /* 品名太長自動截斷加...，絕對不破壞高度 */
            }
            
            .footer-block {
              margin-top: auto; /* 精準將簽名欄總計釘在最底部 */
            }
            
            table { width: 100%; border-collapse: collapse; }
            td { padding: 2px 0; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .small { font-size: 11px; }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      document.body.removeChild(iframe);
    }, 150);
  };

  if (loading) return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace' }}><p>載入中...</p></div>;
  if (!order) return <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'monospace' }}><p>找不到資料</p></div>;

  // 固定一頁 5 樣商品的演算邏輯
  const ITEMS_PER_PAGE = 5;
  const items = order.items || [];
  const pageChunks = [];
  
  for (let i = 0; i < items.length; i += ITEMS_PER_PAGE) {
    pageChunks.push(items.slice(i, i + ITEMS_PER_PAGE));
  }
  if (pageChunks.length === 0) pageChunks.push([]);

  return (
    <div className="print-page-root">
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .print-page-root { 
          font-family: "Courier New", "Menlo", "Monaco", Consolas, "Liberation Mono", monospace;
          font-size: 13px;
          line-height: 1.4;
          background: #525659; 
          color: black;
          padding: 20px;
          min-height: 100vh;
          overflow-y: auto;
        }
        .print-container { width: 8.5in; margin: 0 auto 60px auto; }
        .receipt {
          width: 8.5in; height: 5.5in; background: white; border: 1px solid #111;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3); padding: 15px 35px; margin-bottom: 25px;
          box-sizing: border-box; overflow: hidden; display: flex; flex-direction: column;
        }
        .footer-buttons {
          position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); 
          background: rgba(255,255,255,0.95); padding: 12px 24px; border-radius: 30px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4); z-index: 999; display: flex; gap: 15px;
        }
        .footer-buttons button { padding: 10px 28px; font-size: 14px; font-weight: bold; cursor: pointer; background: #2563eb; color: white; border: none; border-radius: 20px; }
        .footer-buttons button:hover { background: #1d4ed8; }
        .footer-buttons .btn-close { background: #4b5563; }
        
        .header { text-align: center; padding-bottom: 4px; margin-bottom: 2px; border-bottom: 1px dashed #000; }
        .header h1 { font-weight: bold; font-size: 18px; margin-bottom: 2px; }
        .header p { font-size: 12px; }
        .line { text-align: center; margin: 3px 0; font-size: 13px; }
        .info-table { width: 100%; border-collapse: collapse; margin-bottom: 2px; }
        .details-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .details-table th, .details-table td { padding: 3px 0; height: 22px; line-height: 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .footer-block { margin-top: auto; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .small { font-size: 11px; }
      `}</style>

      <div className="print-container">
        <div id="receipt-print-area">
          {pageChunks.map((chunkItems, index) => {
            const isLastPage = index === pageChunks.length - 1;

            return (
              <div className="receipt" key={index}>
                {/* 每一頁上方都印店頭與客戶資訊，確保單據完整性 */}
                <div className="header">
                  <h1>萬詠國際貿易有限公司</h1>
                  <p>TEL: 05-5871980</p>
                </div>
                
                <div className="line line-solid">========================================</div>
                
                <table className="info-table">
                  <tbody>
                    <tr>
                      <td style={{ width: '50%' }}>訂單: {order.order_number || '-'}</td>
                      <td style={{ width: '50%' }} className="text-right">
                        日: {new Date(order.created_at).toLocaleDateString('zh-TW')}
                        {pageChunks.length > 1 ? ` (頁次: ${index + 1}/${pageChunks.length})` : ''}
                      </td>
                    </tr>
                    <tr>
                      <td>客戶: {order.customer_name || '散客'}</td>
                      <td className="text-right">{order.vehicle_plate ? '車牌: ' + order.vehicle_plate : ''}</td>
                    </tr>
                  </tbody>
                </table>
                
                <div className="line line-dashed">----------------------------------------</div>
                
                {/* 明細表格：每一頁不論商品幾件，一律精準補足 5 行空間 */}
                <div style={{ flex: 1 }}>
                  <table className="details-table">
                    <thead>
                      <tr style={{ fontWeight: 'bold', borderBottom: '1px dashed #000' }}>
                        <th style={{ width: '50%', textAlign: 'left', fontWeight: 'normal' }}>品名</th>
                        <th style={{ width: '15%', textAlign: 'center', fontWeight: 'normal' }}>數量</th>
                        <th style={{ width: '17.5%', textAlign: 'right', fontWeight: 'normal' }}>單價</th>
                        <th style={{ width: '17.5%', textAlign: 'right', fontWeight: 'normal' }}>小計</th>
                      </tr>
                    </thead>
                    <tbody>
                      {chunkItems.map((item, itemIdx) => (
                        <tr key={itemIdx}>
                          <td>{item.product_name || item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-right">${item.unit_price?.toLocaleString()}</td>
                          <td className="text-right">${item.subtotal?.toLocaleString()}</td>
                        </tr>
                      ))}
                      {/* 不滿 5 行時自動補空行，穩定撐開中間表格的垂直高度 */}
                      {chunkItems.length < ITEMS_PER_PAGE && 
                        Array.from({ length: ITEMS_PER_PAGE - chunkItems.length }).map((_, emptyIdx) => (
                          <tr key={`empty-${emptyIdx}`}>
                            <td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td>
                          </tr>
                        ))
                      }
                    </tbody>
                  </table>
                </div>

                {/* 尾部區塊：利用 margin-top: auto 釘死在中一刀最底部 */}
                <div className="footer-block">
                  {isLastPage ? (
                    /* 只有最後一頁（尾頁）才印總計、結帳欄位與會計簽章 */
                    <>
                      <div className="line line-dashed">----------------------------------------</div>
                      <table>
                        <tbody>
                          <tr>
                            <td>總    計:</td>
                            <td className="text-right">${order.total_amount?.toLocaleString()}</td>
                          </tr>
                          {order.discount > 0 && (
                            <tr>
                              <td>折    扣:</td>
                              <td className="text-right">-${order.discount?.toLocaleString()}</td>
                            </tr>
                          )}
                          <tr style={{ fontWeight: 'bold', borderTop: '1px dashed #000' }}>
                            <td style={{ paddingTop: '2px' }}>應收金額:</td>
                            <td className="text-right">${order.final_amount?.toLocaleString()}</td>
                          </tr>
                          <tr style={{ fontWeight: 'bold' }}>
                            {/* 左邊留空，把空間讓給右邊 */}
                            <td>&nbsp;</td>
                            {/* 右邊直接強制靠右貼齊 */}
                            <td className="text-right">
                              已付款:_________________ &nbsp;&nbsp; 未付款:_________________
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div className="line line-dashed">----------------------------------------</div>
                      
                      <table>
                        <tbody>
                          <tr>
                            <td style={{ width: '60%' }}>
                              付款方式: {
                                order.payment_method === 'cash' ? '■現金 □信用卡 □轉帳' :
                                order.payment_method === 'card' ? '□現金 □信用卡 ■轉帳' :
                                '□現金 ■信用卡 □轉帳'
                              }
                            </td>
                            <td style={{ width: '40%' }} className="text-right">
                              {order.invoice_number ? '發票: ' + order.invoice_number : ''}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              {order.next_service_date ? '下次回廠: ' + new Date(order.next_service_date + 'T00:00:00').toLocaleDateString('zh-TW', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
                            </td>
                            <td className="text-right">備註: {order.note || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                      
                      <div className="line line-solid"></div>
                      
                      <table style={{ marginTop: '2px', fontSize: '11px' }}>
                        <tbody>
                          <tr>
                            <td style={{ width: '33%' }}>會  計：____________</td>
                            <td style={{ width: '34%', textAlign: 'center' }}>倉  管：_____________</td>
                            <td style={{ width: '33%', textAlign: 'right' }}>客戶簽收：_____________</td>
                          </tr>
                        </tbody>
                      </table>
                    </>
                  ) : (
                    /* 中間分頁：不顯示金額與簽名，乾淨沉底印出接續提示 */
                    <div style={{ paddingBottom: '15px' }}>
                      <div className="line line-dashed">----------------------------------------</div>
                      <div className="text-center bold" style={{ fontSize: '13px', letterSpacing: '2px', padding: '5px 0' }}>
                        * * * 內容未完 請接續下一頁 * * *
                      </div>
                      <div className="line line-solid">========================================</div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <div className="footer-buttons">
        <button onClick={handlePrint}>立即列印</button>
        <button className="btn-close" onClick={() => window.close()}>關閉視窗</button>
      </div>
    </div>
  )
}