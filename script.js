function copyAccount() {
  const account = document.getElementById("account").innerText;

  navigator.clipboard.writeText(account)
    .then(() => {
      alert("계좌번호가 복사되었습니다.");
    })
    .catch(() => {
      alert("계좌번호를 직접 복사해주세요.");
    });
}
