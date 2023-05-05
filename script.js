'use strict';

/////////////////////////////////////////////////
/////////////////////////////////////////////////
// BANKIST APP

// Data
const account1 = {
  owner: 'Sezer Limanlar',
  movements: [300, 700, -500, -250, 740, 255, -150, 870],
  interestRate: 1.2, // %
  pin: 111,
  movementsDates: [
    '2020-11-18T21:31:17.178Z',
    '2020-12-23T07:42:02.383Z',
    '2021-01-28T09:15:04.904Z',
    '2021-04-01T10:17:24.185Z',
    '2022-05-08T14:11:59.604Z',
    '2022-05-04T17:01:17.194Z',
    '2022-05-03T23:36:17.929Z',
    '2023-05-01T10:51:36.790Z',
  ],
  currency: 'TRY',
  locale: 'tr-TR', // de-DE
};

const account2 = {
  owner: 'Ceren Bozgun',
  movements: [2700, 400, -50, -720, 3210, -100, 850, -35],
  interestRate: 1.5,
  pin: 222,
  movementsDates: [
    '2021-11-01T13:15:33.035Z',
    '2021-11-30T09:48:16.867Z',
    '2022-12-25T06:04:23.907Z',
    '2022-01-25T14:18:46.235Z',
    '2022-02-05T16:33:06.386Z',
    '2023-05-01T14:43:26.374Z',
    '2023-05-02T18:49:59.371Z',
    '2023-05-03T12:01:20.894Z',
  ],
  currency: 'USD',
  locale: 'en-US',
};

const accounts = [account1, account2];

// Elements
const labelWelcome = document.querySelector('.welcome');
const labelDate = document.querySelector('.date');
const labelBalance = document.querySelector('.balance__value');
const labelSumIn = document.querySelector('.summary__value--in');
const labelSumOut = document.querySelector('.summary__value--out');
const labelSumInterest = document.querySelector('.summary__value--interest');
const labelTimer = document.querySelector('.timer');

const containerApp = document.querySelector('.app');
const containerMovements = document.querySelector('.movements');

const btnLogin = document.querySelector('.login__btn');
const btnTransfer = document.querySelector('.form__btn--transfer');
const btnLoan = document.querySelector('.form__btn--loan');
const btnClose = document.querySelector('.form__btn--close');
const btnSort = document.querySelector('.btn--sort');
const btnDelete = document.querySelector('.form__btn--delete');

const inputLoginUsername = document.querySelector('.login__input--user');
const inputLoginPin = document.querySelector('.login__input--pin');
const inputTransferTo = document.querySelector('.form__input--to');
const inputTransferAmount = document.querySelector('.form__input--amount');
const inputLoanAmount = document.querySelector('.form__input--loan-amount');
const inputCloseUsername = document.querySelector('.form__input--user');
const inputClosePin = document.querySelector('.form__input--pin');
const inputDeleteUsername = document.querySelector('.form__input--del--user');
const inputDeletePin = document.querySelector('.form__input--del--pin');

let timer;
//Kullanıcıların isim ve soyisminin ilk harflerinden kullanıcı adı oluşturma
const createUserName = function (accs) {
  accs.forEach(acc => {
    acc.username = acc.owner
      .toLowerCase()
      .split(' ')
      .map(user => user[0])
      .join('');
  });
};
createUserName(accounts);

//Gelir gider tablosu tarih aralığı ayarlaru
const formatMovementDate = function (date, locale) {
  const calcDaysPassed = (date1, date2) =>
    Math.abs(date1 - date2) / (1000 * 60 * 60 * 24);
  const dayPassed = Math.trunc(calcDaysPassed(new Date(), date));
  if (dayPassed == 0) {
    return 'Bugün';
  }
  if (dayPassed == 1) {
    return 'Dün';
  }
  if (dayPassed <= 7) {
    return `${dayPassed} gün önce`;
  }

  return new Intl.DateTimeFormat(locale).format(date);
};

//Sayıların formatını ayarlama
const formatNumber = function (value, locale, currency) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(value);
};

//Gelir gider tablosu ve bakiye güncelleme
const updateUI = function (acc) {
  displayMovements(acc);
  displayTotal(acc);
};

//Otomatik çıkış süresini sıfırlama
const resetTimer = function () {
  if (timer) clearInterval(timer);
  timer = startLogOutTimer();
};

//Gelir gider tablosu sıralama, ekleme, yenileme
const displayMovements = function (acc, sort = false) {
  containerMovements.innerHTML = '';
  const movs = sort
    ? acc.movements.slice().sort((a, b) => a - b)
    : acc.movements;
  movs.forEach((mov, i) => {
    const date = new Date(acc.movementsDates[i]);
    const displayDate = formatMovementDate(date, acc.locale);
    const type = mov > 0 ? 'gelir' : 'gider';

    const formattedMov = formatNumber(mov, acc.locale, acc.currency);

    const html = `
    <div class="movements__row">
          <div class="movements__type movements__type--${type}">${
      i + 1
    } ${type}</div>
          <div class="movements__date">${displayDate}</div> 
          <div class="movements__value">${formattedMov}</div>
        </div>
    `;
    containerMovements.insertAdjacentHTML('afterbegin', html);
  });
};

//Toplam gelir, gider, faiz ve toplam mevcut bakiye hesaplama
const displayTotal = function (acc) {
  //gelir
  const totalIn = acc.movements
    .filter(money => money > 0)
    .reduce((acc, curr) => acc + curr, 0);
  labelSumIn.textContent = formatNumber(totalIn, acc.locale, acc.currency);

  //gider
  const totalOut = acc.movements
    .filter(money => money < 0)
    .reduce((acc, curr) => acc + curr, 0);
  labelSumOut.textContent = formatNumber(
    Math.abs(totalOut),
    acc.locale,
    acc.currency
  );

  //mevcut bakiye
  const totalBalance = totalIn + totalOut;
  labelBalance.textContent = formatNumber(
    totalBalance,
    acc.locale,
    acc.currency
  );
  acc.balance = totalBalance;

  //faiz
  const interest = acc.movements
    .filter(money => money > 0)
    .map(deposit => (deposit * acc.interestRate) / 100)
    .filter((int, i, arr) => int >= 1)
    .reduce((acc, cur) => acc + cur, 0);
  labelSumInterest.textContent = formatNumber(
    interest,
    acc.locale,
    acc.currency
  );
};

//Otomatik çıkış ayarlama
const startLogOutTimer = function () {
  let time = 300;
  let min = Math.trunc(time / 60);
  let sec = time % 60;
  const tick = function () {
    if (sec > 0) {
      sec--;
    } else if (min > 0) {
      min--;
      sec = 59;
    } else {
      clearInterval(timer);
      containerApp.style.opacity = 0;
      labelWelcome.textContent = '#SEZ BANK';
    }

    labelTimer.textContent =
      min.toString().padStart(2, 0) + ':' + sec.toString().padStart(2, 0);
  };
  tick();
  const timer = setInterval(tick, 1000);
  return timer;
};

//Kullanıcı giriş
btnLogin.addEventListener('click', function (e) {
  e.preventDefault();
  const username = inputLoginUsername.value;
  const pin = inputLoginPin.value;
  inputLoginUsername.value = inputLoginPin.value = '';
  const currAccount = accounts.find(
    account => username == account.username && pin == account.pin
  );

  if (currAccount) {
    //Menülerin ekranda gözükmesi
    containerApp.style.opacity = 1;

    resetTimer();
    //Kullanıcıya özel hoşgeldin yazısı
    labelWelcome.textContent = `Hoşgeldin, ${currAccount.owner.slice(
      0,
      currAccount.owner.indexOf(' ')
    )}!`;

    //Kredi çekme menüsü
    btnLoan.addEventListener('click', e => {
      e.preventDefault();

      const loanAmount = +Math.floor(inputLoanAmount.value);
      if (
        loanAmount > 0 &&
        currAccount.movements.some(mov => mov >= loanAmount * 0.1)
      ) {
        inputLoanAmount.value = '';
        setTimeout(() => {
          resetTimer();
          currAccount.movements.push(loanAmount);
          currAccount.movementsDates.push(new Date().toISOString());
          displayMovements(currAccount);
          displayTotal(currAccount);
        }, 1000);
      }
    });

    //Kullanıcıya özel  bakiye ve gelir gider tablosu güncellemesi
    updateUI(currAccount);

    //Tarih ve saat ayarları
    const now = new Date();
    const options = {
      month: 'long',
      year: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      weekday: 'long',
    };
    const fullDate = new Intl.DateTimeFormat(
      currAccount.locale,
      options
    ).format(now);
    labelDate.textContent = fullDate;

    //Hesaptan çıkış yap
    btnClose.addEventListener('click', e => {
      e.preventDefault();
      if (
        inputCloseUsername.value == currAccount.username &&
        inputClosePin.value == currAccount.pin
      ) {
        containerApp.style.opacity = 0;
        labelWelcome.textContent = '#SEZ BANK';
        inputClosePin.value = inputCloseUsername.value = '';
      }
    });

    //Hesabı sil
    btnDelete.addEventListener('click', e => {
      e.preventDefault();
      if (
        inputDeleteUsername.value == currAccount.username &&
        inputDeletePin.value == currAccount.pin
      ) {
        if (confirm('İşlemi onaylıyor musunuz?')) {
          const index = accounts.findIndex(
            acc => acc.username == currAccount.username
          );
          accounts.splice(index, 1);
          containerApp.style.opacity = 0;
          inputDeleteUsername.value = inputDeletePin.value = '';
          labelWelcome.textContent = '#SEZ BANK';
        } else {
          alert('İşlem iptal edildi');
        }
      }
    });

    //Gelir gider tablosu sıralama
    let sorted = false;
    btnSort.addEventListener('click', e => {
      e.preventDefault();
      displayMovements(currAccount, !sorted);
      console.log(sorted);
      console.log(!sorted);
      sorted = !sorted;
    });

    //Kullanıcılar arası bakiye transferi
    btnTransfer.addEventListener('click', e => {
      e.preventDefault();
      let transferAmount = Number(inputTransferAmount.value);
      let transferTo = accounts.find(
        acc => acc.username == inputTransferTo.value
      );

      console.log(currAccount.username);
      if (
        transferAmount > 0 &&
        transferTo &&
        currAccount.balance >= transferAmount &&
        currAccount.username !== transferTo.username
      ) {
        setTimeout(() => {
          resetTimer();
          transferTo.movements.push(transferAmount);
          transferTo.movementsDates.push(new Date().toISOString());
          currAccount.movements.push(-transferAmount);
          currAccount.movementsDates.push(new Date().toISOString());
          inputTransferAmount.value = inputTransferTo.value = '';

          updateUI(currAccount);
        }, 1000);
      }
    });
  }
});
