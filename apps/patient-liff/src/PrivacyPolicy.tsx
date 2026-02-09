import { Link } from 'react-router-dom';

export const PrivacyPolicy = () => {
    return (
        <div style={{
            padding: '20px',
            color: '#333',
            background: '#fff',
            minHeight: '100vh',
            fontFamily: '"Helvetica Neue", Arial, "Hiragino Kaku Gothic ProN", "Hiragino Sans", Meiryo, sans-serif',
            lineHeight: 1.6
        }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ fontSize: '1.5rem', borderBottom: '2px solid #00f0ff', paddingBottom: '10px', marginBottom: '20px' }}>プライバシーポリシー</h1>

                <section style={{ marginBottom: '20px' }}>
                    <p>日本体育大学スポーツキュアセンター横浜・健志台接骨院（以下、「当院」といいます。）は、本ウェブサイト上で提供するサービス（以下、「本サービス」といいます。）における、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。</p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>第1条（個人情報）</h2>
                    <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報、および容貌、指紋、声紋にかかるデータ、および健康保険証の保険者番号などの当該情報単体から特定の個人を識別できる情報（個人識別情報）を指します。</p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>第2条（個人情報の収集方法）</h2>
                    <p>当院は、ユーザーが利用登録をする際に氏名、電話番号、診察券番号、LINEアカウント情報などの個人情報をお尋ねすることがあります。</p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>第3条（個人情報を収集・利用する目的）</h2>
                    <p>当院が個人情報を収集・利用する目的は、以下のとおりです。</p>
                    <ol style={{ paddingLeft: '20px' }}>
                        <li>当院サービスの提供・運営のため</li>
                        <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                        <li>メンテナンス、重要なお知らせなど必要に応じたご連絡のため</li>
                        <li>利用規約に違反したユーザーや、不正・不当な目的でサービスを利用しようとするユーザーの特定をし、ご利用をお断りするため</li>
                        <li>上記の利用目的に付随する目的</li>
                    </ol>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>第4条（利用目的の変更）</h2>
                    <p>当院は、利用目的が変更前と関連性を有すると合理的に認められる場合に限り、個人情報の利用目的を変更するものとします。利用目的の変更を行った場合には、変更後の目的について、当院所定の方法により、ユーザーに通知し、または本ウェブサイト上に公表するものとします。</p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>第5条（個人情報の第三者提供）</h2>
                    <p>当院は、あらかじめユーザーの同意を得ることなく、第三者に個人情報を提供することはありません。ただし、個人情報保護法その他の法令で認められる場合を除きます。</p>
                </section>

                <section style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '10px' }}>第6条（お問い合わせ窓口）</h2>
                    <p>本ポリシーに関するお問い合わせは、当院窓口までお願いいたします。</p>
                    <p style={{ marginTop: '10px' }}>
                        日本体育大学スポーツキュアセンター横浜・健志台接骨院<br />
                        住所: 神奈川県横浜市青葉区鴨志田町1221-1<br />
                    </p>
                </section>

                <div style={{ marginTop: '40px', textAlign: 'center' }}>
                    <Link to="/" style={{
                        display: 'inline-block',
                        padding: '10px 20px',
                        backgroundColor: '#00f0ff',
                        color: '#000',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        borderRadius: '5px'
                    }}>
                        アプリに戻る
                    </Link>
                </div>
            </div>
        </div>
    );
};
