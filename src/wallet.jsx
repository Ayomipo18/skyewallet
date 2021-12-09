import React from 'react';
import sendSVG from './upload.svg';

const SingleTransaction = ({type, name, amount, date}) => {
    return (
        <div className='transaction'>
            <div>
                <p className='transName'>{name}</p>
                <p className='transDate'>{new Date(date).toDateString() + ' ' + new Date(date).toLocaleString('en-US', {minute : 'numeric', hour : 'numeric'})}</p>
            </div>
            <div>
                <p style={{color : type === 'credit' ? 'rgb(8, 75, 8)' : 'rgb(99, 14, 14)'}} className='transAmount'>{amount} Naira</p>
            </div>
        </div>
    )
}
const initialState = {
    seeReceived : true,
    sending : false,
    attemptingTransfer : false,
    sendError : '',
    sendSuccess : '',
    signup : false,
    email : '',
    password : '',
    fullName : '',
    phoneNumber: '',
    beneficiary : '',
    amount : 0,
    attemptingAuth : false,
    authError : '',
    authSuccess : '',
    userData : {},
    token : '',
    authenticated : false,
    credits : [],
    debits : [],
    otherUsers : []
}
class Wallet extends React.Component {
    state = initialState;

    reset = () => this.setState(initialState);

    seeReceived = bool => {
        if(bool === this.state.seeReceived) return;
        this.setState({seeReceived : !this.state.seeReceived})
    }
    submitTransferForm = e => {
        e.preventDefault();
        this.setState({attemptingTransfer : true, sendError : '', sendSuccess : ''});
        fetch('https://sendmoneyy.herokuapp.com/transfer', {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    Authorization : `Bearer ${this.state.token}`
                },
                body: JSON.stringify({user : this.state.userData._id, amount : this.state.amount, beneficiary : this.state.beneficiary}),
        })
        .then(res => res.json())
        .then(data => {
            if(data.error) this.setState({sendError : data.error, attemptingTransfer : false})
            else this.setState({sendSuccess : data.message, userData : data.user, attemptingTransfer : false})
        })
        .catch(err => this.setState({attemptingTransfer : false, sendError : 'Network Error, try again.'}))
    }
    onInputChange = name => e => {
        this.setState({[name] : e.target.value})
    }
    submitAuth = e => {
        this.setState({authError : '', authSuccess : '', attemptingAuth : true});
        let {email, fullName, password, phoneNumber} = this.state;
        e.preventDefault();
        if(this.state.signup) {
            fetch('https://sendmoneyy.herokuapp.com/register', {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email, fullName, password, phoneNumber}),
            })
            .then(res => res.json())
            .then(data => {
                if(data.error) this.setState({authError : data.error, attemptingAuth : false})
                else this.setState({authSuccess : data.message, attemptingAuth : false})
            })
            .catch(err => this.setState({authError : 'Network Error, try again', attemptingAuth : false}))
        }
        else {
            fetch('https://sendmoneyy.herokuapp.com/login', {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({email, password}),
            })
            .then(res => res.json())
            .then(data => {
                if(data.error) this.setState({authError : data.error, attemptingAuth : false})
                else this.setState({token : data.token, userData : data.user, attemptingAuth : false}, () => {
                    this.getOtherUsers()
                    this.getCredits()
                    this.getDebits()
                    this.setState({authenticated : true})
                })
            })
            .catch(err => this.setState({authError : 'Network Error, try again', attemptingAuth : false}))
        }
    }
    logout = () => {
        this.reset()
    }
    getOtherUsers = () => {
        fetch('https://sendmoneyy.herokuapp.com/users')
        .then(res => res.json())
        .then(data => {
            this.setState({otherUsers : data.users.filter(user => user._id !== this.state.userData._id)})
        })
    }
    getCredits = () => {
        fetch('https://sendmoneyy.herokuapp.com/userCredits', {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    Authorization : `Bearer ${this.state.token}`
                },
                body: JSON.stringify({user : this.state.userData._id}),
        })
        .then(res => res.json())
        .then(data => {
            if(data.error) return;
            this.setState({credits : data.transactions})
        })
    }
    getDebits = () => {
        fetch('https://sendmoneyy.herokuapp.com/userDebits', {
                method : 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    Authorization : `Bearer ${this.state.token}`
                },
                body: JSON.stringify({user : this.state.userData._id}),
        })
        .then(res => res.json())
        .then(data => {
            if(data.error) return;
            this.setState({debits : data.transactions})
        })
    }
    render() {
        if(!this.state.authenticated) {
            return (
                <div className='auth-page'>
                    <form onSubmit={this.submitAuth} className="auth-form">
                        <input onChange={this.onInputChange('email')} type="email" placeholder='Email Address'/>
                        {this.state.signup && <input onChange={this.onInputChange('fullName')} type="text" placeholder='Full Name'/>}
                        {this.state.signup && <input onChange={this.onInputChange('phoneNumber')} type="tel" placeholder='Phone Number'/>}
                        <input onChange={this.onInputChange('password')} type="password" placeholder='Password'/>
                        {this.state.attemptingAuth ? <div className="loader"></div> : <button className='auth-button'>{!this.state.signup ? 'LOGIN' : 'REGISTER'}</button>}
                        <p style={{textAlign : 'center'}}>{this.state.signup ? 'Already have an account ?' : "Don't have an account ?"} <button style={{fontSize : '17px', color : '#0d6e46'}} onClick = {() => this.setState({signup : !this.state.signup, authError : ''})} type='button'>{this.state.signup ? 'Login' : 'Register'}</button></p>
                        {this.state.authError && <p className="error">{this.state.authError}</p>}
                        {this.state.authSuccess && <p className="success">{this.state.authSuccess}</p>}
                    </form>
                </div>
            )
        }
        else {
            let {fullName, balance} = this.state.userData;
            return (
                <div className='dashboard'>
                    <h1>Hi, {fullName}</h1>
                    <button onClick={this.logout} className='btnLogout'>Log Out</button>
                    <section className="details-box">
                        <header className='balance-text'>CURRENT BALANCE</header>
                        <p className='balance'>{balance} Naira</p>
                        <hr/>
                        <div className='sendSection'>
                            <button onClick = {() => this.setState({sending : true})} className='sendBtn' id='sendBtn'>
                                <img src={sendSVG} alt="Send money"/>
                            </button>
                            <label htmlFor='sendBtn'>Send</label>
                        </div>
                    </section>
                    <section className="transactions">
                        <header>LATEST TRANSACTIONS</header>
                        <div className='toggleTransaction'>
                            <button onClick={() => this.seeReceived(true)} className={`receivedBtn ${this.state.seeReceived ? 'active' : ''}`}>RECEIVED</button>
                            <button onClick={() => this.seeReceived(false)} className={`sentBtn ${!this.state.seeReceived ? 'active' : ''}`}>SENT</button>
                        </div>
                        <div className="transactionsList">
                            {this.state.seeReceived ? this.state.credits.reverse().map(credit => <SingleTransaction key = {credit._id} type='credit' name={credit.user.fullName} date={credit.time} amount={credit.amount}/>) : this.state.debits.reverse().map(debit => <SingleTransaction key={debit._id} type='debit' name={debit.beneficiary.fullName} date={debit.time} amount={debit.amount}/>)}
                        </div>
                    </section>
                    {this.state.sending && 
                        <section className='sendModal'>
                            <button onClick = {() => this.setState({sending : false})} className='btnCloseSend'>X</button>
                            <form onSubmit={this.submitTransferForm} className='sendForm'>
                                <p className='formHead'>SEND MONEY</p>
                                <div style={{padding: '12px'}}>
                                    <div>
                                        <label htmlFor="amount">Amount</label>
                                        <input onChange={this.onInputChange('amount')} id='amount' type="number"/>
                                    </div>
                                    <div>
                                        <label htmlFor="beneficiary">Beneficiary</label>
                                        <select defaultValue='disabled' onChange={this.onInputChange('beneficiary')} id="beneficiary">
                                            <option value='disabled' disabled>Select beneficiary</option>
                                            {this.state.otherUsers.map(user => <option key={user._id} value={user._id}>{user.paymentID || 'null'}</option>)}
                                        </select>
                                        {!this.state.attemptingTransfer ? <button className='btnTransfer'>TRANSFER</button> : <div className='loader'></div>}
                                        {this.state.sendSuccess && <p className="success">{this.state.sendSuccess}</p>}
                                        {this.state.sendError && <p className='error'>{this.state.sendError}</p>}
                                    </div>
                                </div>
                            </form>
                        </section>
                    }
                </div>
            )
        
        }
    }
}

export default Wallet;