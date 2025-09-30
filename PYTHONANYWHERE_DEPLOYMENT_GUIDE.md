# 🚀 Complete Guide: Deploying AuctionHub to PythonAnywhere

## 📋 Prerequisites

Before you start, make sure you have:
- ✅ A [PythonAnywhere](https://www.pythonanywhere.com/) account (free tier works fine)
- ✅ Your auction website files ready
- ✅ Basic knowledge of file uploads and command line

---

## 🗂️ Step 1: Prepare Your Files

### 1.1 Update Configuration

**Update API configuration in `js/api-config.js`:**
```javascript
// Replace 'yourusername' with your actual PythonAnywhere username
this.baseURL = 'https://yourusername.pythonanywhere.com/api';
```

**Update WSGI file (`wsgi.py`):**
```python
# Replace 'yourusername' with your actual PythonAnywhere username
project_home = '/home/yourusername/auction-website'
```

**Update production backend (`app_production.py`):**
```python
# Update upload folder path
app.config['UPLOAD_FOLDER'] = '/home/yourusername/auction-website/static/uploads'

# Update CORS settings
CORS(app, origins=['https://yourusername.pythonanywhere.com'])
```

### 1.2 File Structure to Upload
```
auction-website/
├── static/
│   ├── uploads/           # Create this directory
│   ├── css/
│   └── js/
├── templates/ (optional)
├── instance/
├── app_production.py      # Main Flask app for production
├── wsgi.py               # WSGI configuration
├── requirements.txt      # Python dependencies
├── index.html           # Frontend files
├── login.html
├── signup.html
├── sell.html
├── product.html
├── contact.html
├── styles.css
├── js/
│   ├── api-config.js
│   ├── auction-main.js
│   ├── auth.js
│   └── sell.js
└── (all other HTML, CSS, JS files)
```

---

## 📤 Step 2: Upload Files to PythonAnywhere

### 2.1 Using the Files Tab

1. **Log into PythonAnywhere**
2. **Go to the "Files" tab**
3. **Navigate to your home directory** (`/home/yourusername/`)
4. **Create project directory:**
   - Click "New directory"
   - Name it `auction-website`
   - Enter the directory

### 2.2 Upload Your Files

**Method A: ZIP Upload (Recommended)**
1. **Compress your project** into a ZIP file on your computer
2. **Upload the ZIP file** via the Files interface
3. **Extract it** by opening a Bash console and running:
   ```bash
   cd /home/yourusername/
   unzip auction-website.zip
   ```

**Method B: Individual File Upload**
1. **Upload each file** using the "Upload a file" button
2. **Maintain the folder structure** as shown above
3. **Create necessary directories** using "New directory"

### 2.3 Set Permissions
```bash
# Open a Bash console and run:
cd /home/yourusername/auction-website
chmod +x app_production.py
chmod +x wsgi.py
mkdir -p static/uploads
chmod 755 static/uploads
```

---

## 🐍 Step 3: Setup Python Environment

### 3.1 Create Virtual Environment
```bash
# In Bash console:
cd /home/yourusername/auction-website
python3.10 -m venv venv
source venv/bin/activate
```

### 3.2 Install Dependencies
```bash
# With virtual environment activated:
pip install -r requirements.txt
```

### 3.3 Test Installation
```bash
# Check if Flask is installed correctly:
python -c "import flask; print('Flask version:', flask.__version__)"
```

---

## 🌐 Step 4: Configure Web App

### 4.1 Create Web App

1. **Go to the "Web" tab**
2. **Click "Add a new web app"**
3. **Choose "Manual configuration"**
4. **Select Python 3.10**
5. **Click "Next"**

### 4.2 Configure WSGI File

1. **In the Web tab, find the "Code" section**
2. **Click on the WSGI configuration file link**
3. **Replace the contents** with:

```python
import sys
import os

# Add your project directory to Python path
project_home = '/home/yourusername/auction-website'  # Replace yourusername
if project_home not in sys.path:
    sys.path.insert(0, project_home)

# Activate virtual environment
activate_this = project_home + '/venv/bin/activate_this.py'
if os.path.exists(activate_this):
    exec(open(activate_this).read(), dict(__file__=activate_this))

# Set environment variables
os.environ['FLASK_ENV'] = 'production'
os.environ['PYTHONANYWHERE_DOMAIN'] = 'yourusername.pythonanywhere.com'  # Replace yourusername

# Import Flask app
from app_production import app as application

if __name__ == "__main__":
    application.run()
```

### 4.3 Configure Static Files

1. **In the Web tab, find "Static files" section**
2. **Add these mappings:**

| URL          | Directory                                    |
|-------------|---------------------------------------------|
| `/static/`   | `/home/yourusername/auction-website/static/` |
| `/js/`       | `/home/yourusername/auction-website/js/`     |
| `/css/`      | `/home/yourusername/auction-website/`        |

### 4.4 Set Working Directory

1. **In the Web tab, find "Code" section**
2. **Set "Working directory"** to: `/home/yourusername/auction-website`

---

## 🗄️ Step 5: Setup Database

### 5.1 Initialize Database
```bash
# In Bash console:
cd /home/yourusername/auction-website
source venv/bin/activate
python3 -c "
from app_production import app, db, init_db
with app.app_context():
    init_db()
    print('Database initialized successfully!')
"
```

### 5.2 Verify Database Creation
```bash
# Check if database file was created:
ls -la instance/
# Should show auction_prod.db file
```

---

## 🔧 Step 6: Environment Configuration

### 6.1 Set Environment Variables

**Create `.env` file (optional but recommended):**
```bash
# In your project directory:
cat > .env << EOF
FLASK_ENV=production
SECRET_KEY=your-super-secret-key-here-change-this
DATABASE_URL=sqlite:///auction_prod.db
PYTHONANYWHERE_DOMAIN=yourusername.pythonanywhere.com
EOF
```

### 6.2 Update API Configuration

**Edit `js/api-config.js` to use your domain:**
```javascript
// Update the base URL to your actual domain
this.baseURL = 'https://yourusername.pythonanywhere.com/api';
```

---

## 🚀 Step 7: Deploy and Test

### 7.1 Reload Web App

1. **Go to Web tab**
2. **Click the green "Reload" button**
3. **Wait for confirmation message**

### 7.2 Test Your Website

**Test these URLs:**
- `https://yourusername.pythonanywhere.com/` - Main website
- `https://yourusername.pythonanywhere.com/api/health` - API health check
- `https://yourusername.pythonanywhere.com/api/categories` - Categories API

### 7.3 Check Error Logs

If something doesn't work:
1. **Go to Web tab**
2. **Click on "Error log"**
3. **Check for any Python errors**
4. **Fix issues and reload**

---

## 🛠️ Step 8: Post-Deployment Setup

### 8.1 Test Core Functionality

**Test these features:**
- ✅ User registration
- ✅ User login
- ✅ Auction creation
- ✅ Bid placement
- ✅ Image upload
- ✅ Contact form

### 8.2 Add Sample Data (Optional)

```bash
# Add sample categories and auctions:
cd /home/yourusername/auction-website
source venv/bin/activate
python3 -c "
from app_production import app, db, User, Auction, Category
import datetime

with app.app_context():
    # Create sample user
    if not User.query.filter_by(username='admin').first():
        admin = User(
            username='admin',
            email='admin@example.com',
            first_name='Admin',
            last_name='User'
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print('Admin user created: admin/admin123')
"
```

---

## 🔒 Step 9: Security & Optimization

### 9.1 Security Checklist

- ✅ **Change default secret key** in production
- ✅ **Use HTTPS** (automatically provided by PythonAnywhere)
- ✅ **Set secure file permissions**
- ✅ **Validate all user inputs**
- ✅ **Use secure password hashing** (already implemented)

### 9.2 Performance Optimization

```bash
# Install gunicorn for better performance (optional):
pip install gunicorn

# Optimize database (run periodically):
python3 -c "
from app_production import app, db
with app.app_context():
    db.engine.execute('VACUUM;')
    print('Database optimized')
"
```

---

## 🐛 Step 10: Troubleshooting

### Common Issues & Solutions

**Issue: 500 Internal Server Error**
```bash
# Check error logs and run:
cd /home/yourusername/auction-website
source venv/bin/activate
python3 app_production.py
# Check for any error messages
```

**Issue: Database errors**
```bash
# Reset database:
rm instance/auction_prod.db
python3 -c "from app_production import init_db; init_db()"
```

**Issue: File upload not working**
```bash
# Check permissions:
ls -la static/uploads/
chmod 755 static/uploads
```

**Issue: Static files not loading**
- Check static file mappings in Web tab
- Ensure file paths are correct
- Verify files were uploaded correctly

**Issue: API calls failing**
- Check CORS settings in `app_production.py`
- Verify API base URL in `js/api-config.js`
- Test API endpoints directly

---

## 📱 Step 11: Custom Domain (Optional)

### If you want to use your own domain:

1. **Upgrade to PythonAnywhere paid account**
2. **Go to Web tab**
3. **Add custom domain**
4. **Update DNS settings** at your domain provider
5. **Update `js/api-config.js`** with your custom domain

---

## 📊 Step 12: Monitoring & Maintenance

### 12.1 Regular Maintenance Tasks

**Weekly:**
```bash
# Backup database:
cp instance/auction_prod.db instance/backup_$(date +%Y%m%d).db

# Clean up old uploads (optional):
find static/uploads/ -type f -mtime +30 -delete
```

**Monthly:**
```bash
# Update dependencies:
source venv/bin/activate
pip list --outdated
pip install -U package_name
```

### 12.2 Monitoring

- **Check error logs** regularly via Web tab
- **Monitor disk usage** in Dashboard
- **Test critical functionality** monthly

---

## 🎉 Success! Your Auction Website is Live!

Your auction website should now be fully functional at:
`https://yourusername.pythonanywhere.com`

### 🌟 Features Now Available:
- ✅ **User Authentication** - Login/Signup
- ✅ **Auction Management** - Create, browse, bid
- ✅ **Image Upload** - Upload auction images
- ✅ **Real-time Updates** - Live auction data
- ✅ **Secure Backend** - JSON data storage
- ✅ **Responsive Design** - Works on all devices

### 🔗 Important URLs:
- **Main Site:** `https://yourusername.pythonanywhere.com/`
- **Admin API:** `https://yourusername.pythonanywhere.com/api/health`
- **Categories:** `https://yourusername.pythonanywhere.com/api/categories`

---

## 📞 Need Help?

If you encounter any issues:

1. **Check the troubleshooting section** above
2. **Review PythonAnywhere documentation**
3. **Check error logs** in the Web tab
4. **Test locally first** before deploying changes

**Happy Auctioning! 🎊**