using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using HIyaghar.Infra;
using Hiya2.Server.Models;
using Hiya2.Server.Services;

namespace Hiya2.Server.Controllers
{
    public class CustomerLoginDto
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CustomerRegisterDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MobileNo { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string? Username { get; set; }
        public string? ReferralCode { get; set; }
    }

    public class ChangeCustomerPasswordDto
    {
        public string CurrentPassword { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    public class ForgotPasswordGenerateOtpDto
    {
        public string Email { get; set; } = string.Empty;
    }

    public class ForgotPasswordVerifyOtpDto
    {
        public string Email { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
    }

    public class ForgotPasswordResetDto
    {
        public string Email { get; set; } = string.Empty;
        public string Otp { get; set; } = string.Empty;
        public string NewPassword { get; set; } = string.Empty;
    }

    [ApiController]
    [Route("api/[controller]")]
    public class CustomerAuthController : ControllerBase
    {
        private readonly DataContext _context;
        private readonly ICustomerAuthService _authService;
        private readonly IEmailService _emailService;
        private readonly IRewardService _rewardService;

        public CustomerAuthController(DataContext context, ICustomerAuthService authService, IEmailService emailService, IRewardService rewardService)
        {
            _context = context;
            _authService = authService;
            _emailService = emailService;
            _rewardService = rewardService;
        }

        /// <summary>
        /// Customer Login API - Accepts Email or Mobile Number + Password.
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] CustomerLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return BadRequest(new { isSuccess = false, message = "Email/Mobile and Password are required." });
            }

            var input = dto.Email.Trim().ToLower();

            var customer = await _context.Customers
                .FirstOrDefaultAsync(c =>
                    !c.IsDeleted &&
                    c.IsActive &&
                    (c.Email.ToLower() == input || c.MobileNo == dto.Email.Trim())
                );

            if (customer == null)
            {
                return Unauthorized(new { isSuccess = false, message = "Invalid Email/Mobile or Password." });
            }

            bool isPasswordValid = _authService.VerifyPassword(dto.Password, customer.PasswordHash);
            if (!isPasswordValid)
            {
                return Unauthorized(new { isSuccess = false, message = "Invalid Password." });
            }

            if (PasswordHasherService.NeedsRehash(customer.PasswordHash))
            {
                customer.PasswordHash = _authService.HashPassword(dto.Password);
                await _context.SaveChangesAsync();
            }

            var token = _authService.GenerateCustomerToken(customer);

            // Best-effort - a bonus-crediting failure should never block login.
            try
            {
                await _rewardService.CreditDailyLoginBonusAsync(customer.CustomerId);
            }
            catch
            {
                // Swallowed intentionally - see comment above.
            }

            return Ok(new
            {
                isSuccess = true,
                token,
                customer = new
                {
                    customerId = customer.CustomerId,
                    firstName = customer.FirstName,
                    lastName = customer.LastName,
                    email = customer.Email,
                    mobileNo = customer.MobileNo,
                    gender = customer.Gender,
                    dateOfBirth = customer.DateOfBirth,
                    username = customer.Username,
                    referralCode = customer.ReferralCode,
                    rewardCoins = customer.RewardCoins
                }
            });
        }

        /// <summary>
        /// Customer Registration API - Creates a new active Customer account.
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] CustomerRegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FirstName))
            {
                return BadRequest(new { isSuccess = false, message = "Please enter First Name." });
            }
            if (string.IsNullOrWhiteSpace(dto.Email) || !dto.Email.Contains("@"))
            {
                return BadRequest(new { isSuccess = false, message = "Please enter a valid Email address." });
            }
            if (string.IsNullOrWhiteSpace(dto.MobileNo) || dto.MobileNo.Length < 10)
            {
                return BadRequest(new { isSuccess = false, message = "Please enter a valid 10-digit Mobile Number." });
            }
            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 8)
            {
                return BadRequest(new { isSuccess = false, message = "Password must be at least 8 characters long." });
            }

            var emailClean = dto.Email.Trim().ToLower();
            var mobileClean = dto.MobileNo.Trim();

            bool emailExists = await _context.Customers.AnyAsync(c => c.Email.ToLower() == emailClean && !c.IsDeleted);
            if (emailExists)
            {
                return BadRequest(new { isSuccess = false, message = "An account with this Email address already exists." });
            }

            bool mobileExists = await _context.Customers.AnyAsync(c => c.MobileNo == mobileClean && !c.IsDeleted);
            if (mobileExists)
            {
                return BadRequest(new { isSuccess = false, message = "An account with this Mobile Number already exists." });
            }

            var newCustomer = new Customer
            {
                FirstName = dto.FirstName.Trim(),
                LastName = dto.LastName?.Trim() ?? string.Empty,
                Email = emailClean,
                MobileNo = mobileClean,
                PasswordHash = _authService.HashPassword(dto.Password),
                Username = string.IsNullOrWhiteSpace(dto.Username) ? null : dto.Username.Trim(),
                IsActive = true,
                IsDeleted = false,
                CreatedDate = DateTime.Now
            };

            await _context.Customers.AddAsync(newCustomer);
            await _context.SaveChangesAsync();

            // Own referral code can only be generated once the identity Id is known.
            newCustomer.ReferralCode = $"HIYA{newCustomer.CustomerId:D6}";

            if (!string.IsNullOrWhiteSpace(dto.ReferralCode))
            {
                var referrer = await _context.Customers.FirstOrDefaultAsync(c =>
                    c.ReferralCode == dto.ReferralCode.Trim() && !c.IsDeleted && c.IsActive);
                if (referrer != null && referrer.CustomerId != newCustomer.CustomerId)
                {
                    newCustomer.ReferredByCustomerId = referrer.CustomerId;
                }
            }

            await _context.SaveChangesAsync();

            if (newCustomer.ReferredByCustomerId.HasValue)
            {
                await _rewardService.CreditReferralBonusAsync(newCustomer.CustomerId, newCustomer.ReferredByCustomerId.Value);
            }
            await _rewardService.CreditSignupBonusAsync(newCustomer.CustomerId);

            var token = _authService.GenerateCustomerToken(newCustomer);

            return Ok(new
            {
                isSuccess = true,
                message = "Account created successfully!",
                token,
                customer = new
                {
                    customerId = newCustomer.CustomerId,
                    firstName = newCustomer.FirstName,
                    lastName = newCustomer.LastName,
                    email = newCustomer.Email,
                    mobileNo = newCustomer.MobileNo,
                    username = newCustomer.Username,
                    referralCode = newCustomer.ReferralCode,
                    rewardCoins = newCustomer.RewardCoins
                }
            });
        }

        /// <summary>
        /// Get Authenticated Customer Profile.
        /// </summary>
        [Authorize]
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var claimSub = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(claimSub, out var customerId) || customerId <= 0)
            {
                return Unauthorized(new { isSuccess = false, message = "Invalid customer token." });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId && !c.IsDeleted && c.IsActive);
            if (customer == null)
            {
                return NotFound(new { isSuccess = false, message = "Customer profile not found." });
            }

            return Ok(new
            {
                isSuccess = true,
                customer = new
                {
                    customerId = customer.CustomerId,
                    firstName = customer.FirstName,
                    lastName = customer.LastName,
                    email = customer.Email,
                    mobileNo = customer.MobileNo,
                    gender = customer.Gender,
                    dateOfBirth = customer.DateOfBirth,
                    username = customer.Username,
                    referralCode = customer.ReferralCode,
                    rewardCoins = customer.RewardCoins
                }
            });
        }

        /// <summary>
        /// Change Customer Password.
        /// </summary>
        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangeCustomerPasswordDto dto)
        {
            var claimSub = User.FindFirstValue("CustomerId") ?? User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (!long.TryParse(claimSub, out var customerId) || customerId <= 0)
            {
                return Unauthorized(new { isSuccess = false, message = "Invalid customer token." });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == customerId && !c.IsDeleted && c.IsActive);
            if (customer == null)
            {
                return NotFound(new { isSuccess = false, message = "Customer profile not found." });
            }

            if (!_authService.VerifyPassword(dto.CurrentPassword, customer.PasswordHash))
            {
                return BadRequest(new { isSuccess = false, message = "Current password is incorrect." });
            }

            customer.PasswordHash = _authService.HashPassword(dto.NewPassword);
            customer.LastModifiedDate = DateTime.Now;

            _context.Customers.Update(customer);
            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Password updated successfully." });
        }

        private const string GenericOtpRequestedMessage = "If an account with that email exists, an OTP has been sent to it.";

        /// <summary>
        /// Step 1 of forgot-password: generate and email a 6-digit OTP.
        /// Always returns the same generic message regardless of whether the
        /// <summary>
        /// Step 1 of forgot-password: look up the user by email, generate a
        /// 6-digit OTP, store it in PasswordResetOtp with a 10m expiry, and send it.
        /// If the email is not registered, returns an error response.
        /// </summary>
        [HttpPost("forgot-password/generate-otp")]
        public async Task<IActionResult> ForgotPasswordGenerateOtp([FromBody] ForgotPasswordGenerateOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email))
            {
                return BadRequest(new { isSuccess = false, message = "Email is required." });
            }

            var emailClean = dto.Email.Trim().ToLower();
            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.Email.ToLower() == emailClean && !c.IsDeleted && c.IsActive);

            if (customer == null)
            {
                return BadRequest(new { isSuccess = false, message = "Invalid credentials. Email is not registered." });
            }

            var otpCode = Random.Shared.Next(100000, 1000000).ToString();

            await _context.PasswordResetOtps.AddAsync(new PasswordResetOtp
            {
                CustomerId = customer.CustomerId,
                Email = customer.Email,
                OtpCode = otpCode,
                ExpiresAt = DateTime.Now.AddMinutes(10),
                IsUsed = false,
                CreatedDate = DateTime.Now
            });
            await _context.SaveChangesAsync();

            var sendResult = await _emailService.SendEmailAsync(
                customer.Email,
                "Your HIYAGHAR Password Reset OTP",
                "otp_message",
                new Dictionary<string, string>
                {
                    ["customerName"] = $"{customer.FirstName} {customer.LastName}".Trim(),
                    ["otp"] = otpCode
                });

            if (!sendResult.IsSuccess)
            {
                return BadRequest(new { isSuccess = false, message = sendResult.Message ?? "Failed to send OTP email. Please try again." });
            }

            return Ok(new { isSuccess = true, message = "OTP has been sent to your registered email address." });
        }

        /// <summary>
        /// Step 2 of forgot-password: verify the OTP without consuming it yet
        /// (consumption happens at reset-password, so a verified OTP can still
        /// be used if the user re-enters the same details on that final step).
        /// </summary>
        [HttpPost("forgot-password/verify-otp")]
        public async Task<IActionResult> ForgotPasswordVerifyOtp([FromBody] ForgotPasswordVerifyOtpDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp))
            {
                return BadRequest(new { isSuccess = false, message = "Email and OTP are required." });
            }

            var emailClean = dto.Email.Trim().ToLower();
            var validOtp = await _context.PasswordResetOtps
                .Where(o => o.Email.ToLower() == emailClean && o.OtpCode == dto.Otp.Trim() && !o.IsUsed && o.ExpiresAt > DateTime.Now)
                .OrderByDescending(o => o.CreatedDate)
                .FirstOrDefaultAsync();

            if (validOtp == null)
            {
                return BadRequest(new { isSuccess = false, message = "Invalid or expired OTP." });
            }

            return Ok(new { isSuccess = true, message = "OTP verified." });
        }

        /// <summary>
        /// Step 3 of forgot-password: re-validates the OTP, sets the new password, and marks the OTP used.
        /// </summary>
        [HttpPost("forgot-password/reset-password")]
        public async Task<IActionResult> ForgotPasswordReset([FromBody] ForgotPasswordResetDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Email) || string.IsNullOrWhiteSpace(dto.Otp))
            {
                return BadRequest(new { isSuccess = false, message = "Email and OTP are required." });
            }
            if (string.IsNullOrWhiteSpace(dto.NewPassword) || dto.NewPassword.Length < 8)
            {
                return BadRequest(new { isSuccess = false, message = "Password must be at least 8 characters long." });
            }

            var emailClean = dto.Email.Trim().ToLower();
            var validOtp = await _context.PasswordResetOtps
                .Where(o => o.Email.ToLower() == emailClean && o.OtpCode == dto.Otp.Trim() && !o.IsUsed && o.ExpiresAt > DateTime.Now)
                .OrderByDescending(o => o.CreatedDate)
                .FirstOrDefaultAsync();

            if (validOtp == null)
            {
                return BadRequest(new { isSuccess = false, message = "Invalid or expired OTP." });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.CustomerId == validOtp.CustomerId && !c.IsDeleted);
            if (customer == null)
            {
                return NotFound(new { isSuccess = false, message = "Account not found." });
            }

            customer.PasswordHash = _authService.HashPassword(dto.NewPassword);
            customer.LastModifiedDate = DateTime.Now;
            validOtp.IsUsed = true;

            await _context.SaveChangesAsync();

            return Ok(new { isSuccess = true, message = "Password reset successfully. You can now log in with your new password." });
        }
    }
}
